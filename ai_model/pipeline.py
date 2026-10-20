"""唐一可：统一分析入口；替换 classify 即可接入真实模型。"""
from signal_processing.python.ecg_preprocessing import process
from ai_model.inference.factory import predict

def classify(processed):
    return predict(None, processed)

def analyze(signal):
    result = process(signal)
    result['prediction'] = classify(result) if result['quality']['status'] != 'insufficient' else {'status': 'skipped_quality', 'label': None, 'confidence': None, 'model_version': None, 'explanation': '数据不足，请重新记录'}
    result['source'] = signal.get('source', 'unknown')
    result['mode'] = 'framework_demo'
    return result
