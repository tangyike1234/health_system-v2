import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services import storage
from ai_model.eval.model_eval_report import evaluate

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(storage, 'DB', tmp_path/'test.sqlite3')
    with TestClient(app) as client:
        yield client

def account(client, name):
    body = {'username':name,'password':'test-password-123'}
    assert client.post('/api/v1/auth/register',json=body).status_code == 200
    response = client.post('/api/v1/auth/login',json=body)
    assert response.status_code == 200
    return {'Authorization':'Bearer '+response.json()['token']}

def test_full_record_grant_revoke(client):
    owner, relative = account(client,'owner'), account(client,'relative')
    assert client.get('/api/v1/records').status_code == 401
    response = client.post('/api/v1/acquisition/replay',headers=owner)
    assert response.status_code == 202
    task_id = response.json()['id']
    status = client.get('/api/v1/tasks/'+task_id, headers=owner).json()
    assert status['status'] == 'completed'
    assert client.get('/api/v1/tasks/'+task_id, headers=relative).status_code == 404
    record = status['record']
    identifier = record['id']
    assert record['result']['prediction']['status'] == 'model_unavailable'
    assert record['result']['prediction']['label'] is None
    assert len(client.get('/api/v1/records',headers=owner).json()) == 1
    path = '/api/v1/records/'+identifier
    assert client.get(path,headers=relative).status_code == 404
    grant = client.post('/api/v1/family/grants',json={'username':'relative'},headers=owner).json()
    assert client.get(path,headers=relative).status_code == 200
    assert len(client.get('/api/v1/records?shared=true',headers=relative).json()) == 1
    assert len(client.get('/api/v1/family/notifications',headers=relative).json()) == 1
    assert client.delete('/api/v1/family/grants/'+grant['id'],headers=relative).status_code == 404
    assert client.delete('/api/v1/family/grants/'+grant['id'],headers=owner).status_code == 200
    assert client.get(path,headers=relative).status_code == 404
    assert client.get('/api/v1/records?shared=true',headers=relative).json() == []
    assert client.get('/api/v1/family/notifications',headers=relative).json() == []
    assert client.get('/api/v1/analyze/unknown',headers=owner).status_code == 404

def test_upload_bad_signal_and_validation(client):
    headers = account(client,'upload-user')
    def upload(content, name='signal.csv', rate='250'):
        return client.post('/api/v1/analyze/ecg',headers=headers,files={'file':(name,content)},data={'sample_rate_hz':rate})
    flat = upload('value\n'+'0\n'*600)
    assert flat.status_code == 202
    flat_record = client.get('/api/v1/tasks/'+flat.json()['id'],headers=headers).json()['record']
    assert flat_record['result']['prediction']['status'] == 'skipped_quality'
    bad = upload('value\nnan\n')
    assert bad.status_code == 202
    assert client.get('/api/v1/tasks/'+bad.json()['id'],headers=headers).json()['status'] == 'failed'
    assert upload('time,value\n0,0.1\n').status_code == 400
    assert upload('1\n',name='signal.dat').status_code == 400
    bad_rate = upload('1\n',rate='0')
    assert client.get('/api/v1/tasks/'+bad_rate.json()['id'],headers=headers).json()['status'] == 'failed'
    assert upload('1'*2_000_001).status_code == 413
    identifier = flat_record['id']
    storage.initialize()
    assert client.get('/api/v1/records/'+identifier,headers=headers).status_code == 200

def test_login_and_logout(client):
    headers = account(client,'auth-user')
    assert client.post('/api/v1/auth/login',json={'username':'auth-user','password':'wrong-password'}).status_code == 401
    assert client.post('/api/v1/auth/logout',headers=headers).status_code == 200
    assert client.get('/api/v1/records',headers=headers).status_code == 401

def test_real_predictions_metric():
    report = evaluate([{'true_label':'N','predicted_label':'N'},{'true_label':'V','predicted_label':'N'}])
    assert report['per_class']['V']['recall'] == 0
    assert report['per_class']['N']['precision'] == .5
    assert report['macro_f1'] == pytest.approx(1/3)
    with pytest.raises(ValueError): evaluate([])


def test_task_failure_and_restart(client, monkeypatch):
    from app.services import records
    headers = account(client, 'task-owner')
    other = account(client, 'other-owner')
    assert client.get('/api/v1/tasks/unknown',headers=headers).status_code == 404
    def fail(signal):
        raise RuntimeError('inference failed')
    monkeypatch.setattr(records, 'analyze', fail)
    response = client.post('/api/v1/acquisition/replay',headers=headers)
    task_id = response.json()['id']
    task = client.get('/api/v1/tasks/'+task_id,headers=headers).json()
    assert task['status'] == 'failed'
    assert 'inference failed' in task['error']
    assert task['record_id'] is None
    assert client.get('/api/v1/tasks/'+task_id,headers=other).status_code == 404
    with storage.connect() as db:
        owner = db.execute('SELECT id FROM users WHERE username=?',('task-owner',)).fetchone()['id']
    pending = records.submit(owner, {'samples':[1,2], 'sample_rate_hz':250})
    running = records.submit(owner, {'samples':[1,2], 'sample_rate_hz':250})
    with storage.connect() as db:
        db.execute("UPDATE analysis_tasks SET status='running' WHERE id=?",(running['id'],))
    records.recover_tasks()
    for task in (pending,running):
        recovered = records.task_status(owner,task['id'])
        assert recovered['status'] == 'failed'
        assert recovered['error']
    assert records.task_status(owner,task_id)['error'] == 'RuntimeError: inference failed'


def test_submission_is_pending_until_background_execution(client, monkeypatch):
    from fastapi import BackgroundTasks
    from app.services import records
    headers = account(client, 'pending-owner')
    monkeypatch.setattr(BackgroundTasks, 'add_task', lambda *args, **kwargs: None)
    response = client.post('/api/v1/acquisition/replay', headers=headers)
    assert response.status_code == 202
    task_id = response.json()['id']
    task = client.get('/api/v1/tasks/'+task_id, headers=headers).json()
    assert task['status'] == 'pending'
    assert task['record_id'] is None
    assert client.get('/api/v1/records',headers=headers).json() == []
    records.execute(task_id)
    records.execute(task_id)  # duplicate delivery must not create a second record
    assert client.get('/api/v1/tasks/'+task_id,headers=headers).json()['status'] == 'completed'
    assert len(client.get('/api/v1/records',headers=headers).json()) == 1


def test_history_pagination_trends_export_and_owner_delete(client):
    owner, relative = account(client, 'history-owner'), account(client, 'history-relative')
    task_ids=[]
    for _ in range(12):
        response=client.post('/api/v1/acquisition/replay',headers=owner)
        assert response.status_code == 202
        task_ids.append(response.json()['id'])
    page=client.get('/api/v1/records?page=2&page_size=5',headers=owner)
    assert page.status_code == 200
    assert page.json()['total'] == 12
    assert page.json()['pages'] == 3
    assert len(page.json()['items']) == 5
    assert client.get('/api/v1/records?page=0',headers=owner).status_code == 422
    trend=client.get('/api/v1/records/trends?days=30',headers=owner).json()
    assert sum(point['records'] for point in trend['days']) == 12
    assert all(point['heart_rate_bpm'] is None for point in trend['days'])
    task=client.get('/api/v1/tasks/'+task_ids[0],headers=owner).json()
    record_id=task['record_id']
    exported=client.get(f'/api/v1/records/{record_id}/export',headers=owner)
    assert exported.status_code == 200
    assert 'timestamp_sec,value,sample_rate_hz' in exported.text
    assert client.get(f'/api/v1/records/{record_id}/export?format=json',headers=owner).json()['id'] == record_id
    grant=client.post('/api/v1/family/grants',json={'username':'history-relative'},headers=owner).json()
    assert client.get(f'/api/v1/records/{record_id}',headers=relative).status_code == 200
    assert client.get(f'/api/v1/records/{record_id}/export',headers=relative).status_code == 404
    assert client.delete(f'/api/v1/records/{record_id}',headers=relative).status_code == 404
    assert client.delete(f'/api/v1/records/{record_id}',headers=owner).status_code == 200
    assert client.get(f'/api/v1/records/{record_id}',headers=owner).status_code == 404
    assert client.get('/api/v1/tasks/'+task_ids[0],headers=owner).status_code == 404
    assert client.get('/api/v1/records?page=1&page_size=20',headers=owner).json()['total'] == 11
    assert client.delete('/api/v1/family/grants/'+grant['id'],headers=owner).status_code == 200
