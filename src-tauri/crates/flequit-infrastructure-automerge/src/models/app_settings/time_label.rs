use flequit_model::models::app_settings::time_label::TimeLabel;
use serde::{Deserialize, Serialize};

/// TimeLabel用Automergeエンティティ定義（ドメインに合わせた最小構成）
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct TimeLabelDocument {
    /// 時間ラベルID
    pub id: String,

    /// ラベル名
    pub name: String,

    /// 時刻（HH:mm形式）
    pub time: String,
}

impl TimeLabelDocument {
    pub fn from_domain_model(time_label: TimeLabel) -> Self {
        Self {
            id: time_label.id,
            name: time_label.name,
            time: time_label.time,
        }
    }

    pub fn to_domain_model(&self) -> Result<TimeLabel, String> {
        Ok(TimeLabel {
            id: self.id.clone(),
            name: self.name.clone(),
            time: self.time.clone(),
        })
    }
}
