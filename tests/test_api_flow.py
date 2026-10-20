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
    assert response.status_code == 200
    record = response.json()
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
    assert flat.status_code == 200
    assert flat.json()['result']['prediction']['status'] == 'skipped_quality'
    assert upload('value\nnan\n').status_code == 400
    assert upload('time,value\n0,0.1\n').status_code == 400
    assert upload('1\n',name='signal.dat').status_code == 400
    assert upload('1\n',rate='0').status_code == 400
    assert upload('1'*2_000_001).status_code == 413
    identifier = flat.json()['id']
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
