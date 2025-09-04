use flequit_model::models::app_settings::view_item::ViewItem;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ViewItemDocument {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub visible: bool,
    pub order: i32,
}

impl ViewItemDocument {
    pub fn from_domain_model(view_item: ViewItem) -> Self {
        Self {
            id: view_item.id,
            label: view_item.label,
            icon: view_item.icon,
            visible: view_item.visible,
            order: view_item.order,
        }
    }

    pub fn to_domain_model(&self) -> Result<ViewItem, String> {
        Ok(ViewItem {
            id: self.id.clone(),
            label: self.label.clone(),
            icon: self.icon.clone(),
            visible: self.visible,
            order: self.order,
        })
    }
}
