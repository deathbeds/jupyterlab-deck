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


*** Keywords ***
Initialize Jupyter Server
    [Documentation]    Set up server with command as defined in atest.py.
    [Arguments]    ${home_dir}
    ${notebook_dir} =    Set Variable    ${home_dir}${/}work
    ${port} =    Get Unused Port
    ${token} =    Generate Random String    64
    ${base url} =    Set Variable    /jl@f/
    @{args} =    Build Custom JupyterLab Args    ${port}    ${token}    ${base url}
    ${rest_args} =    Get Slice From List    ${args}    1
    &{config} =    Create Dictionary
    ...    stdout=${OUTPUT DIR}${/}lab.log
    ...    stderr=STDOUT
    ...    cwd=${notebook_dir}
    ...    env:HOME=${home_dir}
    ...    env:JUPYTER_PREFER_ENV_PATH=0
    ${lab} =    Start New Jupyter Server
    ...    ${args[0]}
    ...    ${port}
    ...    ${base url}
    ...    ${notebook_dir}
    ...    ${token}
    ...    @{rest_args}
    ...    &{config}
    Wait For Jupyter Server To Be Ready    ${lab}
    RETURN    ${lab}

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
    ...    --ServerApp.token\=${token}
    ...    --ServerApp.base_url\=${base url}
    ...    --config\=${config}
    Log    ${args}
    RETURN    @{args}

Initialize Fake Home
    [Documentation]    Populate a fake HOME
    ${home_dir} =    Set Variable    ${OUTPUT_DIR}${/}.home
    ${fixtures} =    Normalize Path    ${ROOT}${/}atest${/}fixtures
    ${local} =    Set Variable    ${home_dir}${/}.local
    ${etc} =    Set Variable    ${local}${/}etc${/}jupyter
    OperatingSystem.Copy File
    ...    ${fixtures}${/}overrides.json
    ...    ${etc}${/}labconfig${/}default_setting_overrides.json
    OperatingSystem.Copy File
    ...    ${fixtures}${/}jupyter_config.json
    ...    ${etc}${/}jupyter_config.json
    OperatingSystem.Copy File
    ...    ${fixtures}${/}page_config.json
    ...    ${etc}${/}labconfig${/}page_config.json
    Create Directory    ${home_dir}${/}work
    RETURN    ${home_dir}

Get GeckoDriver Executable Path
    [Documentation]    Find geckodriver
    IF    "${OS}" == "Windows"
        ${executable_path} =    Which    geckodriver.exe
    ELSE
        ${executable_path} =    Which    geckodriver
    END
    RETURN    ${executable_path}
