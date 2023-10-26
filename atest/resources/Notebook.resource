*** Settings ***
Documentation       Keywords for working with the Notebook shell.

Resource            ./CodeMirror.resource
Resource            ./Server.resource
Library             JupyterLibrary


*** Keywords ***
Initialize Jupyter Notebook
    [Documentation]    Get the web app set up for testing.
    ${executable_path} =    Get GeckoDriver Executable Path
    Open Notebook    executable_path=${executable_path}
    Initialize CodeMirror
    Set Window Size    1366    768
    Reload Page
    Wait Until Element Is Visible    css:${JNB CSS TREE LIST}    timeout=10s
