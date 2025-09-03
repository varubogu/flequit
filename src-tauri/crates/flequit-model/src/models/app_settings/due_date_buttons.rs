use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DueDateButtons {
    pub id: String,
    pub name: String,
    pub is_visible: bool,
    pub display_order: i32,
}

impl DueDateButtons {
    pub fn new(id: String, name: String, is_visible: bool, display_order: i32) -> Self {
        Self {
            id,
            name,
            is_visible,
            display_order,
        }
    }

    pub fn with_default_visibility(id: String, name: String, display_order: i32) -> Self {
        Self::new(id, name, true, display_order)
    }
}

impl Default for DueDateButtons {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            is_visible: true,
            display_order: 0,
        }
    }
}