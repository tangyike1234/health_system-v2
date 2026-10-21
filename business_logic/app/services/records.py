"""王书阁：记录、任务状态与持久化。"""
import json
import secrets
import csv
import io
from datetime import datetime, timedelta, timezone
from ai_model.pipeline import analyze
from app.services.storage import connect

PROCESSING_VERSION = "framework-tasks-v1"

def _now():
    return datetime.now(timezone.utc).isoformat()

def _task(task_id, user):
    with connect() as db:
        row = db.execute("SELECT * FROM analysis_tasks WHERE id=? AND owner_id=?", (task_id, user)).fetchone()
    if not row:
        raise LookupError("任务不存在或没有查看权限")
    return dict(row)

def submit(user, signal):
    task_id = secrets.token_hex(12)
    created = _now()
    with connect() as db:
        db.execute("INSERT INTO analysis_tasks VALUES (?,?,?,?,?,?,?,?)", (task_id, user, "pending", created, created, None, None, PROCESSING_VERSION))
        db.execute("INSERT INTO task_inputs VALUES (?,?)", (task_id, json.dumps(signal)))
    return task_status(user, task_id)


def execute(task_id):
    with connect() as db:
        claimed = db.execute("UPDATE analysis_tasks SET status='running', updated_at=? WHERE id=? AND status='pending'", (_now(), task_id))
        if claimed.rowcount != 1:
            return
        row = db.execute("SELECT t.owner_id, i.payload FROM analysis_tasks t JOIN task_inputs i ON i.task_id=t.id WHERE t.id=?", (task_id,)).fetchone()
    try:
        result = analyze(json.loads(row['payload']))
        record = {'id': secrets.token_hex(12), 'created_at': _now(), 'task_status': 'completed', 'task_id': task_id, 'result': result}
        with connect() as db:
            db.execute('INSERT INTO records VALUES (?,?,?,?)', (record['id'], row['owner_id'], record['created_at'], json.dumps(record)))
            db.execute("UPDATE analysis_tasks SET status='completed', updated_at=?, record_id=?, processing_version=? WHERE id=?", (_now(), record['id'], result.get('processing_version', PROCESSING_VERSION), task_id))
    except Exception as exc:
        with connect() as db:
            db.execute("UPDATE analysis_tasks SET status='failed', updated_at=?, error=? WHERE id=?", (_now(), f'{type(exc).__name__}: {exc}', task_id))


def recover_tasks():
    """服务重启时明确收束遗留任务，避免永久停留在 running。"""
    with connect() as db:
        db.execute("UPDATE analysis_tasks SET status='failed', updated_at=?, error=? WHERE status IN ('pending','running')", (_now(), '服务重启时任务未完成，请重新提交'))

def task_status(user, task_id):
    row = _task(task_id, user)
    if row['record_id']:
        row['record'] = detail(user, row['record_id'])
    return row

def create(user, signal):
    task = submit(user, signal)
    execute(task['id'])
    status = task_status(user, task['id'])
    if status['status'] == 'failed':
        raise ValueError(status['error'])
    return status['record']

def _visible_record_rows(user, shared=False):
    with connect() as db:
        if shared:
            return db.execute('SELECT DISTINCT r.id,r.created_at,r.owner_id,r.payload FROM records r JOIN grants g ON g.owner_id=r.owner_id WHERE g.relative_id=? AND g.active=1 ORDER BY r.created_at DESC', (user,)).fetchall()
        else:
            return db.execute('SELECT id,created_at,owner_id,payload FROM records WHERE owner_id=? ORDER BY created_at DESC', (user,)).fetchall()


def list_records(user, shared=False, page=None, page_size=20):
    if page is None:
        return [
            {'id': row['id'], 'created_at': row['created_at']}
            for row in _visible_record_rows(user, shared)
        ]
    start = (page - 1) * page_size
    with connect() as db:
        if shared:
            base = 'FROM records r JOIN grants g ON g.owner_id=r.owner_id WHERE g.relative_id=? AND g.active=1'
            total = db.execute(f'SELECT COUNT(DISTINCT r.id) {base}', (user,)).fetchone()[0]
            rows = db.execute(
                f'SELECT DISTINCT r.id,r.created_at {base} ORDER BY r.created_at DESC,r.id DESC LIMIT ? OFFSET ?',
                (user, page_size, start),
            ).fetchall()
        else:
            total = db.execute('SELECT COUNT(*) FROM records WHERE owner_id=?', (user,)).fetchone()[0]
            rows = db.execute(
                'SELECT id,created_at FROM records WHERE owner_id=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?',
                (user, page_size, start),
            ).fetchall()
    items = [dict(row) for row in rows]
    return {
        'items': items,
        'page': page,
        'page_size': page_size,
        'total': total,
        'pages': (total + page_size - 1) // page_size if total else 0,
        'shared': shared,
    }


def trend(user, shared=False, days=30):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    buckets = {}
    for row in _visible_record_rows(user, shared):
        try:
            created = datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
        except (AttributeError, ValueError):
            continue
        if created < cutoff:
            continue
        date = created.date().isoformat()
        bucket = buckets.setdefault(date, {'date': date, 'records': 0, 'heart_rates': [], 'quality': {}})
        bucket['records'] += 1
        payload = json.loads(row['payload'])
        result = payload.get('result', {})
        quality_status = result.get('quality', {}).get('status', 'unknown')
        bucket['quality'][quality_status] = bucket['quality'].get(quality_status, 0) + 1
        prediction = result.get('prediction', {})
        heart_rate = prediction.get('heart_rate') or {}
        bpm = heart_rate.get('bpm', result.get('heart_rate_bpm'))
        if isinstance(bpm, (int, float)):
            bucket['heart_rates'].append(float(bpm))
    points = []
    for date in sorted(buckets):
        bucket = buckets[date]
        rates = bucket.pop('heart_rates')
        bucket['heart_rate_bpm'] = round(sum(rates) / len(rates), 1) if rates else None
        points.append(bucket)
    return {'days': points, 'days_requested': days, 'shared': shared}


def export_record(user, identifier, format='csv'):
    with connect() as db:
        owner_record = db.execute('SELECT id FROM records WHERE id=? AND owner_id=?', (identifier, user)).fetchone()
    if not owner_record:
        raise LookupError('记录不存在或没有导出权限')
    record = detail(user, identifier)
    if format == 'json':
        return json.dumps(record, ensure_ascii=False, indent=2), 'application/json; charset=utf-8'
    if format != 'csv':
        raise ValueError('导出格式仅支持 csv 或 json')
    result = record.get('result', {})
    prediction = result.get('prediction', {})
    heart_rate = prediction.get('heart_rate') or {}
    output = io.StringIO(newline='')
    writer = csv.DictWriter(output, fieldnames=[
        'timestamp_sec', 'value', 'sample_rate_hz', 'unit', 'source',
        'quality_status', 'quality_reasons', 'heart_rate_bpm', 'record_id', 'created_at',
    ])
    writer.writeheader()
    values = result.get('waveform') or []
    for index, value in enumerate(values):
        writer.writerow({
            'timestamp_sec': index / float(result.get('sample_rate_hz') or 1),
            'value': value,
            'sample_rate_hz': result.get('sample_rate_hz'),
            'unit': result.get('unit'),
            'source': result.get('source'),
            'quality_status': result.get('quality', {}).get('status'),
            'quality_reasons': ';'.join(result.get('quality', {}).get('reasons', [])),
            'heart_rate_bpm': heart_rate.get('bpm', result.get('heart_rate_bpm')),
            'record_id': record.get('id'),
            'created_at': record.get('created_at'),
        })
    return output.getvalue(), 'text/csv; charset=utf-8'


def delete_record(user, identifier):
    with connect() as db:
        row = db.execute('SELECT id FROM records WHERE id=? AND owner_id=?', (identifier, user)).fetchone()
        if not row:
            raise LookupError('记录不存在或没有删除权限')
        task_rows = db.execute('SELECT id FROM analysis_tasks WHERE record_id=?', (identifier,)).fetchall()
        task_ids = [task['id'] for task in task_rows]
        if task_ids:
            db.executemany('DELETE FROM task_inputs WHERE task_id=?', [(task_id,) for task_id in task_ids])
            db.executemany('DELETE FROM analysis_tasks WHERE id=?', [(task_id,) for task_id in task_ids])
        db.execute('DELETE FROM records WHERE id=? AND owner_id=?', (identifier, user))
    return {'id': identifier, 'message': '记录已删除'}

def detail(user, identifier):
    with connect() as db:
        row = db.execute('SELECT * FROM records WHERE id=? AND (owner_id=? OR EXISTS (SELECT 1 FROM grants g WHERE g.owner_id=records.owner_id AND g.relative_id=? AND g.active=1))', (identifier,user,user)).fetchone()
    if not row:
        raise LookupError('记录不存在或没有查看权限')
    return json.loads(row['payload'])
