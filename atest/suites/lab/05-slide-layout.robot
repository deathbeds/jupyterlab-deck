*** Settings ***
Documentation       The slide layout overlay works.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Screenshots.resource
Resource            ../../resources/Docs.resource
Resource            ../../resources/Design.resource

Suite Setup         Set Up Interactive Suite    layout
Suite Teardown      Tear Down Interactive Suite
Test Teardown       Reset Design Tools Test

Force Tags          suite:design


*** Test Cases ***
Slide Layout
    [Documentation]    Use the design tools to work with parts.
    [Tags]    activity:notebook    feature:layover
    Set Attempt Screenshot Directory    lab${/}layout${/}layover
    Start Basic Notebook Deck
    Maybe Open Slide Layout
    Capture Page Screenshot    00-layover.png
    Move A Part    1    0    -100    01-moved.png
    FOR    ${i}    ${handle}    IN ENUMERATE    @{PART_HANDLES}
        Resize A Part    1    ${handle}    10    10    02-${i}-resized.png
    END
    Unfix A Part    1    03-unfixed.png
    Maybe Close Design Tools
    Capture Page Screenshot    04-presenting.png
