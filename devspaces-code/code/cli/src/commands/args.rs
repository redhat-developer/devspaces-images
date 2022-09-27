/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

use std::fmt;

use crate::{constants, log, options, tunnels::code_server::CodeServerArgs};
use clap::{ArgEnum, Args, Parser, Subcommand};

const TEMPLATE: &str = "
 Visual Studio Code CLI - {version}

 Usage: code-insiders.exe [options][paths...]

 To read output from another program, append '-' (e.g. 'echo Hello World | code-insiders.exe -')

 {all-args}";

#[derive(Parser, Debug, Default)]
#[clap(
   help_template = TEMPLATE,
   long_about = None,
   name = "Visual Studio Code CLI",
   version = match constants::LAUNCHER_VERSION { Some(v) => v, None => "dev" },
 )]
pub struct Cli {
    /// One or more files, folders, or URIs to open.
    #[clap(name = "paths")]
    pub open_paths: Vec<String>,

    #[clap(flatten, next_help_heading = Some("EDITOR OPTIONS"))]
    pub editor_options: EditorOptions,

    #[clap(flatten, next_help_heading = Some("EDITOR TROUBLESHOOTING"))]
    pub troubleshooting: EditorTroubleshooting,

    #[clap(flatten, next_help_heading = Some("GLOBAL OPTIONS"))]
    pub global_options: GlobalOptions,

    #[clap(subcommand)]
    pub subcommand: Option<Commands>,
}

impl Cli {
    pub fn get_base_code_args(&self) -> Vec<String> {
        let mut args = self.open_paths.clone();
        self.editor_options.add_code_args(&mut args);
        self.troubleshooting.add_code_args(&mut args);
        self.global_options.add_code_args(&mut args);
        args
    }
}

impl<'a> From<&'a Cli> for CodeServerArgs {
    fn from(cli: &'a Cli) -> Self {
        let mut args = CodeServerArgs {
            log: cli.global_options.log,
            accept_server_license_terms: true,
            ..Default::default()
        };

        args.log = cli.global_options.log;
        args.accept_server_license_terms = true;

        if cli.global_options.verbose {
            args.verbose = true;
        }

        if cli.global_options.disable_telemetry {
            args.telemetry_level = Some(options::TelemetryLevel::Off);
        } else if cli.global_options.telemetry_level.is_some() {
            args.telemetry_level = cli.global_options.telemetry_level;
        }

        args
    }
}

#[derive(Subcommand, Debug, Clone)]

pub enum Commands {
    /// Create a tunnel that's accessible on vscode.dev from anywhere.
    /// Run `code tunnel --help` for more usage info.
    Tunnel(TunnelArgs),

    /// Manage VS Code extensions.
    #[clap(name = "ext")]
    Extension(ExtensionArgs),

    /// Print process usage and diagnostics information.
    Status,

    /// Changes the version of VS Code you're using.
    Version(VersionArgs),
}

#[derive(Args, Debug, Clone)]
pub struct ExtensionArgs {
    #[clap(subcommand)]
    pub subcommand: ExtensionSubcommand,

    #[clap(flatten)]
    pub desktop_code_options: DesktopCodeOptions,
}

impl ExtensionArgs {
    pub fn add_code_args(&self, target: &mut Vec<String>) {
        if let Some(ed) = &self.desktop_code_options.extensions_dir {
            target.push(ed.to_string());
        }

        self.subcommand.add_code_args(target);
    }
}

#[derive(Subcommand, Debug, Clone)]
pub enum ExtensionSubcommand {
    /// List installed extensions.
    List(ListExtensionArgs),
    /// Install an extension.
    Install(InstallExtensionArgs),
    /// Uninstall an extension.
    Uninstall(UninstallExtensionArgs),
}

impl ExtensionSubcommand {
    pub fn add_code_args(&self, target: &mut Vec<String>) {
        match self {
            ExtensionSubcommand::List(args) => {
                target.push("--list-extensions".to_string());
                if args.show_versions {
                    target.push("--show-versions".to_string());
                }
                if let Some(category) = &args.category {
                    target.push(format!("--category={}", category));
                }
            }
            ExtensionSubcommand::Install(args) => {
                for id in args.id_or_path.iter() {
                    target.push(format!("--install-extension={}", id));
                }
                if args.pre_release {
                    target.push("--pre-release".to_string());
                }
                if args.force {
                    target.push("--force".to_string());
                }
            }
            ExtensionSubcommand::Uninstall(args) => {
                for id in args.id.iter() {
                    target.push(format!("--uninstall-extension={}", id));
                }
            }
        }
    }
}

#[derive(Args, Debug, Clone)]
pub struct ListExtensionArgs {
    /// Filters installed extensions by provided category, when using --list-extensions.
    #[clap(long, value_name = "category")]
    pub category: Option<String>,

    /// Show versions of installed extensions, when using --list-extensions.
    #[clap(long)]
    pub show_versions: bool,
}

#[derive(Args, Debug, Clone)]
pub struct InstallExtensionArgs {
    /// Either an extension id or a path to a VSIX. The identifier of an
    /// extension is '${publisher}.${name}'. Use '--force' argument to update
    /// to latest version. To install a specific version provide '@${version}'.
    /// For example: 'vscode.csharp@1.2.3'.
    #[clap(name = "ext-id | id")]
    pub id_or_path: Vec<String>,

    /// Installs the pre-release version of the extension
    #[clap(long)]
    pub pre_release: bool,

    /// Update to the latest version of the extension if it's already installed.
    #[clap(long)]
    pub force: bool,
}

#[derive(Args, Debug, Clone)]
pub struct UninstallExtensionArgs {
    /// One or more extension identifiers to uninstall. The identifier of an
    /// extension is '${publisher}.${name}'. Use '--force' argument to update
    /// to latest version.
    #[clap(name = "ext-id")]
    pub id: Vec<String>,
}

#[derive(Args, Debug, Clone)]
pub struct VersionArgs {
    #[clap(subcommand)]
    pub subcommand: VersionSubcommand,
}

#[derive(Subcommand, Debug, Clone)]
pub enum VersionSubcommand {
    /// Switches the instance of VS Code in use.
    Use(UseVersionArgs),
    /// Uninstalls a instance of VS Code.
    Uninstall(UninstallVersionArgs),
    /// Lists installed VS Code instances.
    List(OutputFormatOptions),
}

#[derive(Args, Debug, Clone)]
pub struct UseVersionArgs {
    /// The version of VS Code you want to use. Can be "stable", "insiders",
    /// a version number, or an absolute path to an existing install.
    #[clap(value_name = "stable | insiders | x.y.z | path")]
    pub name: String,

    /// The directory the version should be installed into, if it's not already installed.
    #[clap(long, value_name = "path")]
    pub install_dir: Option<String>,

    /// Reinstall the version even if it's already installed.
    #[clap(long)]
    pub reinstall: bool,
}

#[derive(Args, Debug, Clone)]
pub struct UninstallVersionArgs {
    /// The version of VS Code to uninstall. Can be "stable", "insiders", or a
    /// version number previous passed to `code version use <version>`.
    #[clap(value_name = "stable | insiders | x.y.z")]
    pub name: String,
}

#[derive(Args, Debug, Default)]
pub struct EditorOptions {
    /// Compare two files with each other.
    #[clap(short, long, value_names = &["file", "file"])]
    pub diff: Vec<String>,

    /// Add folder(s) to the last active window.
    #[clap(short, long, value_name = "folder")]
    pub add: Option<String>,

    /// Open a file at the path on the specified line and character position.
    #[clap(short, long, value_name = "file:line[:character]")]
    pub goto: Option<String>,

    /// Force to open a new window.
    #[clap(short, long)]
    pub new_window: bool,

    /// Force to open a file or folder in an
    #[clap(short, long)]
    pub reuse_window: bool,

    /// Wait for the files to be closed before returning.
    #[clap(short, long)]
    pub wait: bool,

    /// The locale to use (e.g. en-US or zh-TW).
    #[clap(long, value_name = "locale")]
    pub locale: Option<String>,

    /// Enables proposed API features for extensions. Can receive one or
    /// more extension IDs to enable individually.
    #[clap(long, value_name = "ext-id")]
    pub enable_proposed_api: Vec<String>,

    #[clap(flatten)]
    pub code_options: DesktopCodeOptions,
}

impl EditorOptions {
    pub fn add_code_args(&self, target: &mut Vec<String>) {
        if !self.diff.is_empty() {
            target.push("--diff".to_string());
            for file in self.diff.iter() {
                target.push(file.clone());
            }
        }
        if let Some(add) = &self.add {
            target.push("--add".to_string());
            target.push(add.clone());
        }
        if let Some(goto) = &self.goto {
            target.push("--goto".to_string());
            target.push(goto.clone());
        }
        if self.new_window {
            target.push("--new-window".to_string());
        }
        if self.reuse_window {
            target.push("--reuse-window".to_string());
        }
        if self.wait {
            target.push("--wait".to_string());
        }
        if let Some(locale) = &self.locale {
            target.push(format!("--locale={}", locale));
        }
        if !self.enable_proposed_api.is_empty() {
            for id in self.enable_proposed_api.iter() {
                target.push(format!("--enable-proposed-api={}", id));
            }
        }
        self.code_options.add_code_args(target);
    }
}

/// Arguments applicable whenever VS Code desktop is launched
#[derive(Args, Debug, Default, Clone)]
pub struct DesktopCodeOptions {
    /// Set the root path for extensions.
    #[clap(long, value_name = "dir")]
    pub extensions_dir: Option<String>,

    /// Specifies the directory that user data is kept in. Can be used to
    /// open multiple distinct instances of Code.
    #[clap(long, value_name = "dir")]
    pub user_data_dir: Option<String>,

    /// Sets the VS Code version to use for this command. The preferred version
    /// can be persisted with `code version use <version>`. Can be "stable",
    /// "insiders", a version number, or an absolute path to an existing install.
    #[clap(long, value_name = "stable | insiders | x.y.z | path")]
    pub use_version: Option<String>,
}

/// Argument specifying the output format.
#[derive(Args, Debug, Clone)]
pub struct OutputFormatOptions {
    /// Set the data output formats.
    #[clap(arg_enum, long, value_name = "format", default_value_t = OutputFormat::Text)]
    pub format: OutputFormat,
}

impl DesktopCodeOptions {
    pub fn add_code_args(&self, target: &mut Vec<String>) {
        if let Some(extensions_dir) = &self.extensions_dir {
            target.push(format!("--extensions-dir={}", extensions_dir));
        }
        if let Some(user_data_dir) = &self.user_data_dir {
            target.push(format!("--user-data-dir={}", user_data_dir));
        }
    }
}

#[derive(Args, Debug, Default)]
pub struct GlobalOptions {
    /// Directory where CLI metadata, such as VS Code installations, should be stored.
    #[clap(long, env = "VSCODE_CLI_DATA_DIR", global = true)]
    pub cli_data_dir: Option<String>,

    /// Print verbose output (implies --wait).
    #[clap(long, global = true)]
    pub verbose: bool,

    /// Log level to use.
    #[clap(long, arg_enum, value_name = "level", global = true)]
    pub log: Option<log::Level>,

    /// Disable telemetry for the current command, even if it was previously
    /// accepted as part of the license prompt or specified in '--telemetry-level'
    #[clap(long, global = true, hide = true)]
    pub disable_telemetry: bool,

    /// Sets the initial telemetry level
    #[clap(arg_enum, long, global = true, hide = true)]
    pub telemetry_level: Option<options::TelemetryLevel>,
}

impl GlobalOptions {
    pub fn add_code_args(&self, target: &mut Vec<String>) {
        if self.verbose {
            target.push("--verbose".to_string());
        }
        if let Some(log) = self.log {
            target.push(format!("--log={}", log));
        }
        if self.disable_telemetry {
            target.push("--disable-telemetry".to_string());
        }
        if let Some(telemetry_level) = &self.telemetry_level {
            target.push(format!("--telemetry-level={}", telemetry_level));
        }
    }
}

#[derive(Args, Debug, Default)]
pub struct EditorTroubleshooting {
    /// Run CPU profiler during startup.
    #[clap(long)]
    pub prof_startup: bool,

    /// Disable all installed extensions.
    #[clap(long)]
    pub disable_extensions: bool,

    /// Disable an extension.
    #[clap(long, value_name = "ext-id")]
    pub disable_extension: Vec<String>,

    /// Turn sync on or off.
    #[clap(arg_enum, long, value_name = "on | off")]
    pub sync: Option<SyncState>,

    /// Allow debugging and profiling of extensions. Check the developer tools for the connection URI.
    #[clap(long, value_name = "port")]
    pub inspect_extensions: Option<u16>,

    /// Allow debugging and profiling of extensions with the extension host
    /// being paused after start. Check the developer tools for the connection URI.
    #[clap(long, value_name = "port")]
    pub inspect_brk_extensions: Option<u16>,

    /// Disable GPU hardware acceleration.
    #[clap(long)]
    pub disable_gpu: bool,

    /// Max memory size for a window (in Mbytes).
    #[clap(long, value_name = "memory")]
    pub max_memory: Option<usize>,

    /// Shows all telemetry events which VS code collects.
    #[clap(long)]
    pub telemetry: bool,
}

impl EditorTroubleshooting {
    pub fn add_code_args(&self, target: &mut Vec<String>) {
        if self.prof_startup {
            target.push("--prof-startup".to_string());
        }
        if self.disable_extensions {
            target.push("--disable-extensions".to_string());
        }
        for id in self.disable_extension.iter() {
            target.push(format!("--disable-extension={}", id));
        }
        if let Some(sync) = &self.sync {
            target.push(format!("--sync={}", sync));
        }
        if let Some(port) = &self.inspect_extensions {
            target.push(format!("--inspect-extensions={}", port));
        }
        if let Some(port) = &self.inspect_brk_extensions {
            target.push(format!("--inspect-brk-extensions={}", port));
        }
        if self.disable_gpu {
            target.push("--disable-gpu".to_string());
        }
        if let Some(memory) = &self.max_memory {
            target.push(format!("--max-memory={}", memory));
        }
        if self.telemetry {
            target.push("--telemetry".to_string());
        }
    }
}

#[derive(ArgEnum, Clone, Copy, Debug)]
pub enum SyncState {
    On,
    Off,
}

impl fmt::Display for SyncState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            SyncState::Off => write!(f, "off"),
            SyncState::On => write!(f, "on"),
        }
    }
}

#[derive(ArgEnum, Clone, Copy, Debug)]
pub enum OutputFormat {
    Json,
    Text,
}

#[derive(Args, Clone, Debug, Default)]
pub struct ExistingTunnelArgs {
    /// Name you'd like to assign preexisting tunnel to use to connect the tunnel
    #[clap(long, hide = true)]
    pub tunnel_name: Option<String>,

    /// Token to authenticate and use preexisting tunnel
    #[clap(long, hide = true)]
    pub host_token: Option<String>,

    /// ID of preexisting tunnel to use to connect the tunnel
    #[clap(long, hide = true)]
    pub tunnel_id: Option<String>,

    /// Cluster of preexisting tunnel to use to connect the tunnel
    #[clap(long, hide = true)]
    pub cluster: Option<String>,
}

#[derive(Args, Debug, Clone, Default)]
pub struct TunnelServeArgs {
    /// Optional details to connect to an existing tunnel
    #[clap(flatten, next_help_heading = Some("ADVANCED OPTIONS"))]
    pub tunnel: ExistingTunnelArgs,

    /// Randomly name machine for port forwarding service
    #[clap(long)]
    pub random_name: bool,
}

#[derive(Args, Debug, Clone)]
pub struct TunnelArgs {
    #[clap(subcommand)]
    pub subcommand: Option<TunnelSubcommand>,

    #[clap(flatten)]
    pub serve_args: TunnelServeArgs,
}

#[derive(Subcommand, Debug, Clone)]
pub enum TunnelSubcommand {
    /// Delete all servers which are currently not running.
    Prune,

    /// Rename the name of this machine associated with port forwarding service.
    Rename(TunnelRenameArgs),

    /// Remove this machine's association with the port forwarding service.
    Unregister,

    #[clap(subcommand)]
    User(TunnelUserSubCommands),

    /// Manages the tunnel when installed as a system service,
    #[clap(subcommand)]
    Service(TunnelServiceSubCommands),
}

#[derive(Subcommand, Debug, Clone)]
pub enum TunnelServiceSubCommands {
    /// Installs or re-installs the tunnel service on the machine.
    Install,

    /// Uninstalls and stops the tunnel service.
    Uninstall,

    /// Internal command for running the service
    #[clap(hide = true)]
    InternalRun,
}

#[derive(Args, Debug, Clone)]
pub struct TunnelRenameArgs {
    /// The name you'd like to rename your machine to.
    pub name: String,
}

#[derive(Subcommand, Debug, Clone)]
pub enum TunnelUserSubCommands {
    /// Log in to port forwarding service
    Login(LoginArgs),

    /// Log out of port forwarding service
    Logout,

    /// Show the account that's logged into port forwarding service
    Show,
}

#[derive(Args, Debug, Clone)]
pub struct LoginArgs {
    /// An access token to store for authentication. Note: this will not be
    /// refreshed if it expires!
    #[clap(long, requires = "provider")]
    pub access_token: Option<String>,

    /// The auth provider to use. If not provided, a prompt will be shown.
    #[clap(arg_enum, long)]
    pub provider: Option<AuthProvider>,
}

#[derive(clap::ArgEnum, Debug, Clone, Copy)]
pub enum AuthProvider {
    Microsoft,
    Github,
}
