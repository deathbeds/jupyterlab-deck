*** Settings ***
Documentation       The design tools work.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Screenshots.resource
Resource            ../../resources/Docs.resource
Resource            ../../resources/Design.resource

Suite Setup         Set Up Interactive Suite    design
Suite Teardown      Tear Down Interactive Suite
Test Teardown       Reset Interactive Test

Force Tags          suite:design


*** Variables ***
@{HANDLES}      nw    n    ne    w    e    sw    s    se


*** Test Cases ***
Slide Layover Basics
    [Documentation]    Use the design tools to work with parts.
    Set Attempt Screenshot Directory    lab${/}design${/}layover-smoke
    Start Basic Notebook Deck
    Maybe Open Slide Layout
    Capture Page Screenshot    00-layover.png
    Move A Part    1    0    -100    01-moved.png
    FOR    ${i}    ${handle}    IN ENUMERATE    @{HANDLES}
        Resize A Part    1    ${handle}    10    10    02-${i}-resized.png
    END
    Maybe Close Design Tools
    Capture Page Screenshot    03-presenting.png
    [Teardown]    Maybe Close Design Tools
