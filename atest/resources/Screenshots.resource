*** Settings ***
Documentation       Keywords for working with screenshots

Library             OperatingSystem
Library             JupyterLibrary


*** Variables ***
${SCREENSHOT_TRASH}     ${OUTPUT_DIR}${/}__trash__
${OLD_SCREENSHOTS}      ${OUTPUT_DIR}${/}screenshots


*** Keywords ***
Set Attempt Screenshot Directory
    [Documentation]    Set a screenshot directory that includes the attempt
    [Arguments]    ${path}
    Set Screenshot Directory
    ...    ${OUTPUT_DIR}${/}screenshots${/}${OS.lower()[:2]}_${ATTEMPT}${/}${path}

Send Error Screenshots To Trash
    [Documentation]    Throw screenshots in the trash for a while.
    ${old_screens} =    Set Screenshot Directory    ${SCREENSHOT_TRASH}
    Set Global Variable    ${OLD_SCREENSHOTS}    ${old_screens}

Resume Screenshots
    [Documentation]    Restore Screenshots
    Set Screenshot Directory    ${OLD_SCREENSHOTS}

Empty Screenshot Trash
    [Documentation]    Clean out trash.
    Run Keyword And Ignore Error
    ...    Remove Directory    ${SCREENSHOT_TRASH}    ${TRUE}

Capture Page Screenshot And Tag With Error
    [Documentation]    Capture a screenshot if not going to the trash
    ${path} =    Capture Page Screenshot
    IF    "__trash__" not in "${path}"
        Run Keyword And Ignore Error    Set Tags    screenshot:unexpected
    END
