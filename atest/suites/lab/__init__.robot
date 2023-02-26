*** Settings ***
Documentation       Tests for JupyterLab.

Library             uuid
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/LabSelectors.resource

Suite Setup         Set Up Lab Suite
Suite Teardown      Tear Down Lab Suite

Force Tags          app:lab


*** Variables ***
${LOG_DIR}      ${OUTPUT_DIR}${/}logs


*** Keywords ***
Set Up Lab Suite
    [Documentation]    Ensure a testable server is running
    Start Server
    Open JupyterLab    browser=${BROWSER}
    Set Window Size    1366    768
    Initialize JupyterLab Defaults
    Reload Page
    Wait For JupyterLab Splash Screen

Start Server
    [Documentation]    Start a jupyter server
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
    ...    --ServerApp.token\='${token.__str__()}'
    ...    --ServerApp.base_url\='${base_url}'
    ...    stdout=${LOG_DIR}${/}lab.log

Initialize JupyterLab Defaults
    [Documentation]    Apply some configuration after the server has started, but before browser
    Set JupyterLab Plugin Settings    @jupyterlab/apputils-extension    palette
    ...    modal=${FALSE}
    Set JupyterLab Plugin Settings    @jupyterlab/apputils-extension    notification
    ...    checkForUpdates=${FALSE}
    ...    doNotDisturbMode=${TRUE}
    ...    fetchNews=false

Tear Down Lab Suite
    [Documentation]    Do clean up stuff
    Maybe Accept A JupyterLab Prompt
    Maybe Open JupyterLab Sidebar    File Browser
    Maybe Accept A JupyterLab Prompt
    Click Element    css:${CSS_LAB_FILES_HOME}
    Execute JupyterLab Command    Close All Tabs
    Execute JupyterLab Command    Shut Down All Kernels
    Reset JupyterLab And Close With Coverage
