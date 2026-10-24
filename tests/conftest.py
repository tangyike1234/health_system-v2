import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
sys.path.insert(0,str(ROOT/'business_logic'))

import pytest


@pytest.fixture(autouse=True)
def isolated_model_configuration(monkeypatch):
    """Run tests without local models, secrets or external LLM calls."""
    import ai_model.pipeline as pipeline
    monkeypatch.setenv('ECG_MODEL_TYPE', 'none')
    monkeypatch.setenv('ECG_EXPLANATION_PROVIDER', 'template')
    monkeypatch.setattr(pipeline, '_CLASSIFIER', None)
    monkeypatch.setattr(pipeline, '_CLASSIFIER_READY', False)
