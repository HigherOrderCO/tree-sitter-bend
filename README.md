# tree-sitter-bend

Bend grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

# Usage

## Neovim

### Installation

First of all, you need to install [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) with your favorite dependency manager, such as [lazy.nvim](https://github.com/folke/lazy.nvim).

After that, you should add this code snippet to your Neovim configuration right after calling `require("nvim-treesitter.configs").setup()`. The configuration file can be found or created at `~/.config/nvim/init.lua`.

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.bend = {
  install_info = {
    url = "https://github.com/HigherOrderCO/tree-sitter-bend",
    files = { "src/parser.c", "src/scanner.c" },
    branch = "main",
  },
}

vim.filetype.add({
  extension = {
    bend = "bend",
  },
})

vim.treesitter.language.register("bend", { "bend" })
```

Using lazy.nvim, your configuration could look like this:

```lua
plugins = {
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function () 
      local configs = require("nvim-treesitter.configs")

      configs.setup({
        ensure_installed = { "c", "lua", "vim", "vimdoc", "query", "elixir", "heex", "javascript", "html" },
        sync_install = false,
        highlight = { enable = true },
        indent = { enable = true },
      })
      
      local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
      parser_config.bend = {
        install_info = {
          url = "https://github.com/HigherOrderCO/tree-sitter-bend",
          files = { "src/parser.c", "src/scanner.c" },
          branch = "main",
        },
      }
      
      vim.filetype.add({
        extension = {
          bend = "bend",
        },
      })

      vim.treesitter.language.register("bend", { "bend" })
    end
  }
}

require("lazy").setup(plugins)
```

Finally, install the language grammar into the tree-sitter plugin by running `:TSInstall bend` on Neovim.

### Syntax highlighting

For syntax highlighting to work, you have to create a `queries/bend` directory in your Neovim configuration root and copy the file [highlights.scm](./queries/highlights.scm) into it.

You might have to update the Tree-sitter plugin afterwards by running `:TSUpdate` on Neovim.

## VSCode

You can use syntax highlighting on VSCode through our VSCode extension, check out its repository [here](https://github.com/HigherOrderCO/bend-language-server).

# Contributing

The grammar descriptions can be found in the directory [./grammar](./grammar/), called by the main file [./grammar.js](./grammar.js). Most other files are automatically generated by the tree-sitter CLI using `tree-sitter generate`.
