*** Settings ***
Documentation       The slide type commands works.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Screenshots.resource
Resource            ../../resources/Docs.resource
Resource            ../../resources/Design.resource

Suite Setup         Set Up Interactive Suite    slide-type
Suite Teardown      Tear Down Interactive Suite
Test Teardown       Reset Interactive Test

Force Tags          suite:commands    activity:notebook    feature:slide-type-commands


*** Test Cases ***
Single Cell Slide Type
    [Documentation]    Use the _Command Palette_ to update a cell's slide type.
    ${nb} =    Prepare Slide Type Command Test    slide-type-single    1
    FOR    ${slide_type}    IN    @{SLIDE_TYPES}
        Execute JupyterLab Command    Change to ${slide_type} Slide Type
        Slide Types Should Be    ${nb}    ${slide_type}    null    null
    END
    Capture Page Screenshot    04-presenting.png

Multiple Cell Slide Type
    [Documentation]    Use the _Command Palette_ to update multiple cells' slide type.
    ${nb} =    Prepare Slide Type Command Test    slide-type-multi    1    2
    FOR    ${slide_type}    IN    @{SLIDE_TYPES}
        Select Multiple Cells    1    2
        Capture Page Screenshot
        Execute JupyterLab Command    Change to ${slide_type} Slide Type
        Select Multiple Cells    1    2
        Capture Page Screenshot
        Execute JupyterLab Command    Change to ${slide_type} Slide Type
        Capture Page Screenshot
        Slide Types Should Be    ${nb}    ${slide_type}    ${slide_type}    null
    END
    Capture Page Screenshot    04-presenting.png

Reversed Multiple Cell Slide Type
    [Documentation]    Use the _Command Palette_ to update multiple cells' slide type,
    ...    selected in reverse.
    ${nb} =    Prepare Slide Type Command Test    slide-type-multi    3    2    1
    FOR    ${slide_type}    IN    @{SLIDE_TYPES}
        Select Multiple Cells    3    2    1
        Execute JupyterLab Command    Change to ${slide_type} Slide Type
        Select Multiple Cells    3    2    1
        Execute JupyterLab Command    Change to ${slide_type} Slide Type
        Slide Types Should Be    ${nb}    ${slide_type}    ${slide_type}    null
    END
    Capture Page Screenshot    04-presenting.png


*** Keywords ***    ***
Prepare Slide Type Command Test
    [Documentation]    Do common setup tasks
    [Arguments]    ${test_type}    @{cell_indices}
    Set Attempt Screenshot Directory    lab${/}commands${/}${test_type}
    Start Basic Notebook
    Select Multiple Cells    @{cell_indices}
    Capture Page Screenshot    03-selected.png
    ${nbdir} =    Get Jupyter Directory
    ${nb} =    Set Variable    ${nbdir}${/}Untitled.ipynb
    Slide Types Should Be    ${nb}    null    null    null
    RETURN    ${nb}
