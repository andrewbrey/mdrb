Output ./demos/demo.gif

Require deno
Require mdrb

Set Theme "GruvboxDark"
Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"

# pre-cache runtime deps
Hide
Type "curl -sSLf https://raw.githubusercontent.com/andrewbrey/mdrb/refs/heads/main/demo.md | mdrb"
Enter
Sleep 5s
Type "clear"
Enter
Sleep 500ms
Show

Type "curl -sSLf https://raw.githubusercontent.com/andrewbrey/mdrb/refs/heads/main/demo.md | mdrb"
Enter
Sleep 5s
