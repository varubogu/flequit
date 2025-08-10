use crate::repositories::{
    cloud_automerge::CloudAutomergeRepository,
    core::CoreRepositoryTrait,
    // local_automerge::LocalAutomergeRepository,
    sqlite::SqliteRepository,
    web::WebRepository
};

pub fn get_repository_searcher() -> Box<dyn CoreRepositoryTrait> {
    Box::new(SqliteRepository {})
}

pub fn get_repositories() -> Vec<Box<dyn CoreRepositoryTrait>> {

    let mut repositories: Vec<Box<dyn CoreRepositoryTrait>> = Vec::new();
    let is_sqlite = true;
    let is_local_automerge = true;
    let is_cloud_automerge = false;
    let is_web = false;
    if is_sqlite {
        repositories.push(Box::new(SqliteRepository {}));
    }
    // if is_local_automerge {
    //     repositories.push(Box::new(LocalAutomergeRepository {}));
    // }
    if is_cloud_automerge {
        repositories.push(Box::new(CloudAutomergeRepository {}));
    }
    if is_web {
        repositories.push(Box::new(WebRepository {}));
    }
    repositories
}
