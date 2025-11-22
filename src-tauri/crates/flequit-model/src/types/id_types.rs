use serde::{Deserialize, Serialize};
use std::fmt::Display;
use uuid::Uuid;

macro_rules! define_id {
    ($name:ident) => {
        #[derive(
            Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize,
        )]
        pub struct $name(pub Uuid);

        impl Display for $name {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                self.0.fmt(f)
            }
        }

        impl From<Uuid> for $name {
            fn from(value: Uuid) -> Self {
                Self(value)
            }
        }

        impl From<&str> for $name {
            fn from(value: &str) -> Self {
                Self(Uuid::parse_str(value).unwrap_or_else(|_| Uuid::new_v4()))
            }
        }

        impl From<String> for $name {
            fn from(value: String) -> Self {
                Self::from(value.as_str())
            }
        }

        impl $name {
            pub fn new() -> Self {
                Self(Uuid::new_v4())
            }

            pub fn as_uuid(&self) -> &Uuid {
                &self.0
            }

            pub fn as_str(&self) -> String {
                self.0.to_string()
            }

            pub fn try_from_str(value: &str) -> Result<Self, uuid::Error> {
                Ok(Self(Uuid::parse_str(value)?))
            }
        }

        impl Default for $name {
            fn default() -> Self {
                Self::new()
            }
        }
    };
}

define_id!(ProjectId);
define_id!(RecurrenceRuleId);
define_id!(RecurrenceAdjustmentId);
define_id!(TaskId);
define_id!(TaskListId);
define_id!(SubTaskId);
define_id!(TagId);
define_id!(AccountId);
define_id!(UserId);
define_id!(SettingsId);
define_id!(MemberId);
define_id!(DateConditionId);
define_id!(DueDateButtonsId);
define_id!(WeekdayConditionId);
define_id!(TaskRecurrenceId);
define_id!(SubTaskRecurrenceId);
define_id!(TagBookmarkId);
