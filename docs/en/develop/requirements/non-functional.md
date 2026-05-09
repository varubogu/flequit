# Non-Functional Requirements (Summary)

Summarizes high-level requirements for security, themes, and data structure. See each design document for detailed design.

## Security

- **Authentication**: Email + password authentication will be introduced in the future. Passwords are stored as hashes. Provide 2FA if possible.
- **Access control**: Manage permissions by user role. Control access permissions per resource.
- **Data protection**: Sensitive information is stored encrypted. SSL/TLS is required for communication. See `docs/en/develop/design/data/data-security.md`.
- **Logging**: Log important events such as login and data changes, and audit them regularly.
- **Vulnerability management**: Run regular security testing and monitor dependency vulnerabilities.
- **Incident response**: Define procedures and respond quickly when incidents occur.

## Themes

Three theme types are provided as part of customization features.

- **Official themes**: Built into the app (light, dark, etc.). No network connection required.
- **Public themes**: User-created themes published and distributed through the theme store. Publishing requires registration; downloading does not. Additional features such as favorites are available when logged in.
- **User-local themes**: Local operation. Defined with CSS. Shared by sending files (no network connection required).

Use CSS as the base and consider JSON representation as needed.

## Data Structure Groups

Data is divided into three groups. See `docs/en/develop/design/data/data-model.md` for details.

- **User settings**: Stored locally as JSON. Synchronized to the server as needed.
- **Projects**: Automerge + SQLite + PostgreSQL (server). The program reads from SQLite (pipeline reflects Automerge into SQLite). Automerge documents are per project and do not need ID keys.
- **User list**: Automerge + SQLite. As with projects, SQLite is referenced.
