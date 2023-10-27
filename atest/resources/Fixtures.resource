*** Settings ***
Documentation       Keywords for working with fixtures

Library             JupyterLibrary
Resource            ./LabSelectors.resource
Resource            ./Coverage.resource


*** Variables ***
${ROOT_EXAMPLES}    ${ROOT}${/}examples
${LOGO_SVG}         deck.svg
${HISTORY_IPYNB}    History.ipynb
${LAYERS_IPYNB}     Layers.ipynb
${README_IPYNB}     README.ipynb
${README_MD}        README.md
@{ALL_EXAMPLES}
...                 ${ROOT_EXAMPLES}${/}${LOGO_SVG}
...                 ${ROOT_EXAMPLES}${/}${HISTORY_IPYNB}
...                 ${ROOT_EXAMPLES}${/}${LAYERS_IPYNB}
...                 ${ROOT_EXAMPLES}${/}${README_IPYNB}
...                 ${ROOT_EXAMPLES}${/}${README_MD}


*** Keywords ***
Copy Examples
    [Documentation]    Get the examples from disk into jupyter
    ${nbdir} =    Get Jupyter Directory
    Copy Files    @{ALL_EXAMPLES}    ${nbdir}${/}examples

Clean Examples
    [Documentation]    Clean out the examples
    ${nbdir} =    Get Jupyter Directory
    Run Keyword And Ignore Error
    ...    Remove Directory    ${nbdir}${/}examples    recursive=${TRUE}

Open Example
    [Documentation]    Open an example
    [Arguments]    ${name}=README.ipynb    ${switch_window}=${EMPTY}
    Maybe Open JupyterLab Sidebar    File Browser
    ${selectors} =    Create List
    ...    ${CSS_LAB_FILES_HOME}
    ...    ${CSS_LAB_FILES_DIR_ITEM}\[title^="Name: examples"]
    ...    ${CSS_LAB_FILES_DIR_ITEM}\[title^="Name: ${name}"]
    FOR    ${sel}    IN    @{selectors}
        Wait Until Element Is Visible    css:${sel}
        Double Click Element    css:${sel}
    END
    IF    "${switch_window}"
        Sleep    5s
        Switch Window    NEW
    END
