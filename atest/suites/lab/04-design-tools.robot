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
Test Teardown       Reset Design Tools Test

Force Tags          suite:design    activity:notebook


*** Test Cases ***
Slide Types
    [Documentation]    Use the slide type tool to work with parts.
    [Tags]    feature:slidetype
    Set Attempt Screenshot Directory    lab${/}design${/}slide-types
    Start Basic Notebook Deck
    Maybe Open Design Tools
    FOR    ${i}    ${type}    IN ENUMERATE    @{SLIDE_TYPES}
        Select A Slide Type    2    ${type}    01-${i}-${type}.png
    END
    Capture Page Screenshot    02-presenting.png

Layer Scopes
    [Documentation]    Use the layer scope tool to work with parts.
    [Tags]    feature:layers
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

Sliders
    [Documentation]    Use the slider tools to work with parts.
    [Tags]    feature:slidestyle
    Set Attempt Screenshot Directory    lab${/}design${/}sliders
    Start Basic Notebook Deck
    Maybe Open Design Tools
    FOR    ${i}    ${slider}    IN ENUMERATE    @{SLIDERS}
        Configure A Style With Slider    1    ${slider}    01-${i}-0-${slider}.png
        Unconfigure A Style With Slider    1    ${slider}    01-${i}-1-no-${slider}.png
    END
    Capture Page Screenshot    02-presenting.png
