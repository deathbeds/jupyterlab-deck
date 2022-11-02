*** Settings ***
Documentation       Selectors that should maybe go upstream.


*** Variables ***
# lumino
${CSS_LM_MOD_ACTIVE}                    .lm-mod-active
${CSS_LM_MENU_ITEM_LABEL}               .lm-Menu-itemLabel
${CSS_LM_CLOSE_ICON}                    .lm-TabBar-tabCloseIcon

# lab
${CSS_LAB_FILES_HOME}                   .jp-BreadCrumbs-home
${CSS_LAB_FILES_DIR_ITEM}               .jp-DirListing-item
${CSS_LAB_SPINNER}                      .jp-Spinner
${CSS_LAB_MOD_DISABLED}                 .jp-mod-disabled
${CSS_LAB_MOD_CMD}                      .jp-mod-commandMode
${CSS_LAB_MOD_ACTIVE}                   .jp-mod-active
${CSS_LAB_MOD_EDIT}                     .jp-mod-editMode
${CSS_LAB_MOD_RENDERED}                 .jp-mod-rendered
${CSS_LAB_MOD_HIDDEN}                   .lm-mod-hidden
${CSS_LAB_CELL_MARKDOWN}                .jp-MarkdownCell
${CSS_LAB_CELL_CODE}                    .jp-CodeCell
${CSS_LAB_CELL_RAW}                     .jp-RawCell
${CSS_LAB_NB_TOOLBAR_CELLTYPE}          .jp-Notebook-toolbarCellType
${CSS_LAB_CELL_META_JSON_CM}            .jp-MetadataEditorTool .CodeMirror
${CSS_LAB_CELL_META_JSON_CM_HIDDEN}     ${CSS_LAB_MOD_HIDDEN} ${CSS_LAB_CELL_META_JSON_CM}
${CSS_LAB_ADVANCED_COLLAPSE}            .jp-NotebookTools .jp-Collapse-header
${CSS_LAB_INTERNAL_ANCHOR}              .jp-InternalAnchorLink
${CSS_LAB_NOT_INTERNAL_ANCHOR}          a[href*\="#"]:not([href^="https"]):not(${CSS_LAB_INTERNAL_ANCHOR})
${CSS_LAB_TAB_NOT_CURRENT}              .lm-DockPanel .lm-TabBar-tab:not(.jp-mod-current)

# icons
${CSS_LAB_ICON_ELLIPSES}                [data-icon="ui-components:ellipses"]
${CSS_LAB_ICON_CARET_LEFT}              [data-icon="ui-components:caret-left"]

# markdown
${CSS_LAB_EDITOR}                       .jp-FileEditor
${CSS_LAB_MARKDOWN_VIEWER}              .jp-MarkdownViewer
${CSS_LAB_CMD_MARKDOWN_PREVIEW}         [data-command="fileeditor:markdown-preview"]
