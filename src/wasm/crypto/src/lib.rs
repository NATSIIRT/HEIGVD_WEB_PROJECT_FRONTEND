mod utils;

use wasm_bindgen::prelude::*;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Serialize, Deserialize};
use serde_wasm_bindgen;

#[derive(Serialize, Deserialize)]
pub struct Secret {
    pub title: String,
    pub description: String,
    pub value: String,
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, crypto!");
}

#[wasm_bindgen]
pub fn encode_secret(title: &str, description: &str, value: &str) -> Result<String, JsValue> {
    let secret = Secret {
        title: title.to_string(),
        description: description.to_string(),
        value: value.to_string(),
    };

    let json = serde_json::to_string(&secret)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize secret: {}", e)))?;

    Ok(BASE64.encode(json))
}

#[wasm_bindgen]
pub fn decode_secret(encoded: &str) -> Result<JsValue, JsValue> {
    let decoded = BASE64.decode(encoded)
        .map_err(|e| JsValue::from_str(&format!("Failed to decode base64: {}", e)))?;

    let json_str = String::from_utf8(decoded)
        .map_err(|e| JsValue::from_str(&format!("Failed to convert to UTF-8: {}", e)))?;

    let secret: Secret = serde_json::from_str(&json_str)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse secret: {}", e)))?;

    serde_wasm_bindgen::to_value(&secret)
        .map_err(|e| JsValue::from_str(&format!("Failed to convert to JsValue: {}", e)))
}
