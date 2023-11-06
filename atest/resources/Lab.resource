*** Settings ***
Documentation       Keywords for working with the Lab shell.

Resource            ./CodeMirror.resource
Resource            ./LabSelectors.resource
Resource            ./Screenshots.resource
Library             Collections
Library             JupyterLibrary


*** Keywords ***
Initialize JupyterLab
    [Documentation]    Get the web app set up for testing.
    ${executable_path} =    Get GeckoDriver Executable Path
    Open JupyterLab
    ...    executable_path=${executable_path}
    ...    service_log_path=${OUTPUT_DIR}${/}geckodriver.log    # this doesn't work yet
    Initialize CodeMirror
    Set Window Size    1366    768
    Reload Page
    Wait For JupyterLab Splash Screen

Plugins Should Be Disabled
    [Documentation]    Check that some JupyterLab extensions are disabled by config
    [Arguments]    @{plugins}
    ${disabled} =    Get JupyterLab Page Info    disabledExtensions
    FOR    ${plugin}    IN    @{plugins}
        Should Contain    ${disabled}    ${plugin}    msg=${plugin} was not disabled
    END

Add And Activate Cell With Keyboard
    [Documentation]    Add a cell with the keyboard.
    ${index} =    Get Active Cell Index
    Enter Command Mode
    Press Keys    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})    b
    Wait Until Cell Is Not Active    ${index}    1s
    Sleep    0.2s

Enter Command Mode
    [Documentation]    Activate command mode.
    Press Keys    css:body    ESCAPE
    Wait Until Page Does Not Contain Element    css:${CSS_LAB_MOD_EDIT}    timeout=1s
    Wait Until Page Contains Element    css:${CSS_LAB_MOD_CMD}    timeout=1s
    Press Keys    css:body    ESCAPE
    Sleep    0.2s

Set Cell Type
    [Documentation]    Use the command to change the cell type.
    [Arguments]    ${index}    ${type}    ${timeout}=5s
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})
    Mouse Over    css:${CSS_LAB_NB_TOOLBAR}
    Wait Until Element Is Visible    css:${CSS_LAB_NB_TOOLBAR_CELLTYPE}
    Select From List By Label    css:${CSS_LAB_NB_TOOLBAR_CELLTYPE}    ${type.title()}
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})
    ${sel} =    Get From Dictionary    ${CSS_LAB_CELL_TYPE}    ${type}
    Wait Until Page Contains Element
    ...    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})${sel}
    ...    timeout=${timeout}

Make Markdown Cell
    [Documentation]    Turn the current cell into markdown.
    [Arguments]    ${code}    ${expect}=${EMPTY}    ${new}=${TRUE}    ${screenshot}=${EMPTY}
    Initialize CodeMirror
    ${index} =    Get Active Cell Index
    IF    ${new}
        Add And Activate Cell With Keyboard
        ${index} =    Set Variable    ${index.__add__(1)}
    END
    ${cm} =    Set Variable    ${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index}) ${CM CSS EDITOR}
    Set CodeMirror Value    ${cm}    ${code}
    Set Cell Type    ${index}    markdown
    IF    ${expect.__len__()}    Render Markdown Cell    ${index}    ${expect}
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}

Render Markdown Cell
    [Documentation]    Render the current cell.
    [Arguments]    ${index}    ${expect}=${EMPTY}
    ${sel} =    Set Variable    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})
    Click Element    ${sel}
    ${accel} =    Get ACCEL Key
    Press Keys    ${sel}    ${accel}+ENTER
    IF    ${expect.__len__()}
        Wait Until Element Contains    ${sel}${CSS_LAB_MOD_RENDERED}    ${expect}    timeout=1s
    ELSE
        Wait Until Page Contains Element    ${sel}${CSS_LAB_MOD_RENDERED}    timeout=1s
    END

Get Active Cell Index
    [Documentation]    Get the 1-indexed position of the active cell.
    ${cells} =    Get WebElements    css:${JLAB CSS ACTIVE DOC CELLS}
    ${active} =    Get WebElement    css:${JLAB CSS ACTIVE CELL}
    ${index} =    Get Index From List    ${cells}    ${active}
    RETURN    ${index.__add__(1)}

Wait Until Cell Is Not Active
    [Documentation]    Wait until the given cell is not active.
    [Arguments]    ${index}    ${timeout}=1s
    Wait Until Page Does Not Contain Element    css:${JLAB CSS ACTIVE CELL}:nth-child(${index})    timeout=${timeout}

Maybe Open Cell Metadata JSON
    [Documentation]    Ensure the Cell Metadata viewer is open.

    ${el} =    Get WebElements    ${CSS_LAB_CELL_META_JSON} ${CM CSS EDITOR}

    IF    not ${el.__len__()}    RETURN

    Click Element    ${CSS_LAB_ADVANCED_COLLAPSE}
    Wait Until Page Does Not Contain Element    ${CSS_LAB_CELL_META_JSON_HIDDEN} ${CM CSS EDITOR}

Wait Until Cell Metadata Contains
    [Documentation]    Ensure a string appears in the Cell Metadata JSON
    [Arguments]    ${text}    ${attempts}=5    ${timeout}=0.1s    ${inverse}=${FALSE}

    ${ok} =    Set Variable    ${FALSE}
    FOR    ${i}    IN RANGE    ${attempts}
        ${src} =    Return CodeMirror Method    ${CSS_LAB_CELL_META_JSON} ${CM CSS EDITOR}    ${CM JS TO STRING}
        ${contains} =    Set Variable    ${src.__contains__('''${text}''')}
        IF    ${inverse} and not ${contains}
            ${ok} =    Set Variable    ${TRUE}
            BREAK
        ELSE IF    not ${inverse} and ${contains}
            ${ok} =    Set Variable    ${TRUE}
            BREAK
        END
        Sleep    ${timeout}
    END

    IF    not ${ok}    Capture Page Screenshot

    Should Be True    ${ok}

Wait Until Cell Metadata Does Not Contain
    [Documentation]    Ensure a string does _not_ appear in the Cell Metadata JSON
    [Arguments]    ${text}    ${attempts}=5    ${timeout}=0.1s
    Wait Until Cell Metadata Contains    text=${text}    attempts=${attempts}    timeout=${timeout}    inverse=${TRUE}

Maybe Expand Panel With Title
    [Documentation]    Ensure a collapsed panel in a sidebar is expanded
    [Arguments]    ${label}
    ${els} =    Get WebElements
    ...    xpath:${XP_LAB4_COLLAPSED_PANEL_TITLE}\[contains(., '${label}')]
    IF    not ${els.__len__()}    RETURN
    Click Element    ${els[0]}
