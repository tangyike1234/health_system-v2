"""唐一可：真实模型适配点；没有权重时不生成模拟分类。"""
from typing import Protocol

class Classifier(Protocol):
    def predict(self, processed: dict) -> dict: ...

def load_classifier(model_type: str, model_path: str) -> Classifier:
    raise NotImplementedError('模型尚未接入；需要核实导联、标签、采样率和权重许可')

def predict(model: Classifier | None, signal_data: dict) -> dict:
    if model is None:
        return {'status': 'model_unavailable', 'label': None, 'confidence': None,
                'model_version': None, 'explanation': '真实模型尚未接入，不输出正常或异常分类'}
    return model.predict(signal_data)
