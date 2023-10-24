*** Settings ***
Documentation       Keywords for testing jupyterlab-fonts

Library             BuiltIn
Library             Collections
Library             String
Library             OperatingSystem
Library             JupyterLibrary
Library             shutil
Library             uuid


*** Variables ***
${JUPYTERLAB_EXE}       ["jupyter-lab"]
${JSCOV}                ${EMPTY}
&{ETC_OVERRIDES}
...                     jupyter_config.json=jupyter_config.json
...                     overrides.json=labconfig${/}default_setting_overrides.json
...                     page_config.json=labconfig${/}page_config.json
${FIXTURES}             ${ROOT}${/}atest${/}fixtures


*** Keywords ***
Initialize Jupyter Server
    [Documentation]    Set up server with command as defined in atest.py.
    [Arguments]    ${home_dir}
    ${port} =    Get Unused Port
    ${token} =    Generate Random String    64
    ${base url} =    Set Variable    /jl@d/
    @{args} =    Build Custom JupyterLab Args    ${port}    ${token}    ${base url}
    ${rest_args} =    Get Slice From List    ${args}    1
    ${config} =    Initialize Jupyter Server Config    ${home_dir}
    ${lab} =    Start New Jupyter Server
    ...    ${args[0]}
    ...    ${port}
    ...    ${base url}
    ...    ${config["cwd"]}
    ...    ${token}
    ...    @{rest_args}
    ...    &{config}
    Wait For Jupyter Server To Be Ready    ${lab}
    RETURN    ${lab}

Initialize Jupyter Server Config
    [Documentation]    Prepare keyword arguments to launch a custom jupyter server.
    [Arguments]    ${home_dir}
    ${notebook_dir} =    Set Variable    ${home_dir}${/}work
    ${app_data} =    Get Windows App Data    ${home_dir}
    &{config} =    Create Dictionary
    ...    stdout=${OUTPUT DIR}${/}lab.log
    ...    stderr=STDOUT
    ...    cwd=${notebook_dir}
    ...    env:HOME=${home_dir}
    ...    env:APPDATA=${app_data}
    ...    env:JUPYTER_PREFER_ENV_PATH=0
    RETURN    ${config}

Get Windows App Data
    [Documentation]    Get an overloaded appdata directory.
    [Arguments]    ${home_dir}
    RETURN    ${home_dir}${/}AppData${/}Roaming

Build Custom JupyterLab Args
    [Documentation]    Generate some args
    [Arguments]    ${port}    ${token}    ${base url}
    @{args} =    Loads    ${JUPYTERLAB_EXE}
    ${config} =    Normalize Path    ${ROOT}${/}atest${/}fixtures${/}jupyter_config.json
    @{args} =    Set Variable
    ...    @{args}
    ...    --no-browser
    ...    --debug
    ...    --expose-app-in-browser
    ...    --port\=${port}
    ...    --IdentityProvider.token\=${token}
    ...    --ServerApp.base_url\=${base url}
    Log    ${args}
    RETURN    @{args}

Initialize Fake Home
    [Documentation]    Populate a fake HOME
    ${home_dir} =    Set Variable    ${OUTPUT_DIR}${/}.home
    ${local} =    Get XDG Local Path    ${home_dir}
    ${etc} =    Set Variable    ${local}${/}etc${/}jupyter
    FOR    ${src}    ${dest}    IN    &{ETC_OVERRIDES}
        OperatingSystem.Copy File    ${FIXTURES}${/}${src}    ${etc}${/}${dest}
    END
    Create Directory    ${home_dir}${/}work
    RETURN    ${home_dir}

Get XDG Local Path
    [Documentation]    Get the root of the XDG local data for this platform.
    [Arguments]    ${home_dir}
    IF    "${OS}" == "Windows"
        ${app_data} =    Get Windows App Data    ${home_dir}
        ${local} =    Set Variable    ${app_data}${/}Python
    ELSE
        ${local} =    Set Variable    ${home_dir}${/}.local
    END
    RETURN    ${local}

Get GeckoDriver Executable Path
    [Documentation]    Find geckodriver
    IF    "${OS}" == "Windows"
        ${executable_path} =    Which    geckodriver.exe
    ELSE
        ${executable_path} =    Which    geckodriver
    END
    RETURN    ${executable_path}
