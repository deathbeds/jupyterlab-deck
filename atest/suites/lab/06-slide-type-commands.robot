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
    ${nb} =    Prepare Slide Type Command Test    slide-type-single
    FOR    ${slide_type}    IN    @{SLIDE_TYPES}
        Select Slide Type By Click    ${slide_type}
        Slide Types Should Be    04-${slide_type}.png    ${nb}    ${slide_type}    null    null
    END
    Capture Page Screenshot    05-presenting.png

Multiple Cell Slide Type
    [Documentation]    Use the _Command Palette_ to update multiple cells' slide type.
    ${nb} =    Prepare Slide Type Command Test    slide-type-multi
    FOR    ${slide_type}    IN    @{SLIDE_TYPES}
        Select Multiple Cells    1    2
        Select Slide Type By Click    ${slide_type}
        Slide Types Should Be    04-${slide_type}.png    ${nb}    ${slide_type}    ${slide_type}    null
    END
    Capture Page Screenshot    05-presenting.png


*** Keywords ***
Prepare Slide Type Command Test
    [Documentation]    Do common setup tasks
    [Arguments]    ${test_type}
    Set Attempt Screenshot Directory    lab${/}commands${/}${test_type}
    ${nb} =    Start Basic Notebook    ThreeCells
    ${jdir} =    Get Jupyter Directory
    ${nb} =    Set Variable    ${jdir}${/}${nb}
    Prepare Command Palette For Slide Type
    RETURN    ${nb}
