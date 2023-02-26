*** Settings ***
Documentation       Keywords for working with fixtures

Library             JupyterLibrary
Resource            ./LabSelectors.resource
Resource            ./Coverage.resource


*** Variables ***
${FIXTURES}         ${ROOT}${/}atest${/}fixtures
${ROOT_EXAMPLES}    ${ROOT}${/}examples
${README_IPYNB}     README.ipynb
${README_MD}        README.md
${HISTORY_IPYNB}    History.ipynb
${LAYERS_IPYNB}     Layers.ipynb
@{ALL_EXAMPLES}
...                 ${ROOT_EXAMPLES}${/}${README_IPYNB}
...                 ${ROOT_EXAMPLES}${/}${HISTORY_IPYNB}
...                 ${ROOT_EXAMPLES}${/}${README_MD}
...                 ${ROOT_EXAMPLES}${/}${LAYERS_IPYNB}


*** Keywords ***
Copy Examples
    [Documentation]    Get the examples from disk into jupyter
    ${nbdir} =    Get Jupyter Directory
    Copy Files    @{ALL_EXAMPLES}    ${nbdir}

Clean Examples
    [Documentation]    Clean out the examples
    ${nbdir} =    Get Jupyter Directory
    ${all_notebooks} =    List Files In Directory    ${nbdir}    *.ipynb
    FOR    ${notebook}    IN    ${all_notebooks}
        Remove File    ${nbdir}${/}${notebook}
    END
    Refresh File List

Open Example
    [Documentation]    Open an example
    [Arguments]    ${name}=README.ipynb
    Maybe Open JupyterLab Sidebar    File Browser
    ${selectors} =    Create List
    ...    ${CSS_LAB_FILES_HOME}
    ...    ${CSS_LAB_FILES_DIR_ITEM}\[title^="Name: ${name}"]
    FOR    ${sel}    IN    @{selectors}
        Wait Until Element Is Visible    css:${sel}
        Double Click Element    css:${sel}
    END
    Maybe Close JupyterLab Sidebar
    Click Element    css:${JLAB CSS ACTIVE DOC}

Refresh File List
    [Documentation]    Refresh the files
    Maybe Open JupyterLab Sidebar    File Browser
    Click Element    css:${CSS_LAB_FILES_REFRESH}
    Maybe Close JupyterLab Sidebar
