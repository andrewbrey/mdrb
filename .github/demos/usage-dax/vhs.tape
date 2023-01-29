Output ./demos/demo.gif

Require deno
Require mdrb

Set Theme "Gruvbox Dark"
Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"

# pre-cache runtime deps
Hide
Type "mdrb ./demos/demo.md --mode isolated"
Enter
Sleep 4s
Enter
Sleep 6s
Type "clear"
Enter
Sleep 500ms
Show

Type "mdrb ./demos/demo.md"
Enter
Sleep 1s

Type "y"
Sleep 500ms
Enter
Sleep 2s

Type "y"
Sleep 500ms
Enter
Sleep 2s

Space
Sleep 500ms
Down
Sleep 500ms
Down
Sleep 500ms
Space
Sleep 500ms
Enter

Sleep 1s
Type "y"
Sleep 500ms
Enter

Sleep 3s