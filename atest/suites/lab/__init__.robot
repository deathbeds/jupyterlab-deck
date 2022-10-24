*** Settings ***
Documentation       Tests for JupyterLab.

Library             uuid
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource

Suite Setup         Set Up Lab Suite
Suite Teardown      Terminate All Jupyter Servers
Test Teardown       Reset JupyterLab And Close With Coverage

Force Tags          app:lab


*** Variables ***
${LOG_DIR}      ${OUTPUT_DIR}${/}logs


*** Keywords ***
Set Up Lab Suite
    [Documentation]    Ensure a testable server is running
    ${port} =    Get Unused Port
    ${base_url} =    Set Variable    /@rf/
    ${token} =    UUID4
    Create Directory    ${LOG_DIR}
    Wait For New Jupyter Server To Be Ready
    ...    jupyter-lab
    ...    ${port}
    ...    ${base_url}
    ...    ${NONE}    # notebook_dir
    ...    ${token.__str__()}
    ...    --config\=${ROOT}${/}atest${/}fixtures${/}jupyter_config.json
    ...    --no-browser
    ...    --debug
    ...    --port\=${port}
    ...    --NotebookApp.token\='${token.__str__()}'
    ...    --NotebookApp.base_url\='${base_url}'
    ...    stdout=${LOG_DIR}${/}lab.log
    Open JupyterLab
    Disable JupyterLab Modal Command Palette
