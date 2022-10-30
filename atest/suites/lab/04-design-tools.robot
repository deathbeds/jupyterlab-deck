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


*** Test Cases ***
Slide Layout
    [Documentation]    Use the design tools to work with parts.
    Set Attempt Screenshot Directory    lab${/}design${/}layover
    Start Basic Notebook Deck
    Maybe Open Slide Layout
    Capture Page Screenshot    00-layover.png
    Move A Part    1    0    -100    01-moved.png
    FOR    ${i}    ${handle}    IN ENUMERATE    @{PART_HANDLES}
        Resize A Part    1    ${handle}    10    10    02-${i}-resized.png
    END
    Maybe Close Design Tools
    Capture Page Screenshot    03-presenting.png
    [Teardown]    Maybe Close Design Tools

Slide Types
    [Documentation]    Use the slide type tool to work with parts.
    Set Attempt Screenshot Directory    lab${/}design${/}slide-types
    Start Basic Notebook Deck
    Maybe Open Design Tools
    FOR    ${i}    ${type}    IN ENUMERATE    @{SLIDE_TYPES}
        Select A Slide Type    2    ${type}    01-${i}-${type}.png
    END
    Capture Page Screenshot    02-presenting.png
    [Teardown]    Maybe Close Design Tools

Layer Scopes
    [Documentation]    Use the layer scope tool to work with parts.
    Set Attempt Screenshot Directory    lab${/}design${/}layer-scopes
    Start Basic Notebook Deck
    Make Markdown Cell    - itemA    itemA
    Make Markdown Cell    - itemB    itemB
    Make Markdown Cell    - itemC    itemC
    Make Markdown Cell    - itemD    itemD
    Maybe Open Design Tools
    FOR    ${i}    ${scope}    IN ENUMERATE    @{LAYER_SCOPES}
        Select A Layer Scope    ${i + 2}    ${scope}    01-${i}-${scope}.png
    END
    Capture Page Screenshot    02-presenting.png
    [Teardown]    Maybe Close Design Tools
