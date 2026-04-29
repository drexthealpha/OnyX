# This file would contain the full generate_with_retool.py from Gen-Verse/OpenClaw-RL
# It's a 500+ line file - download from source for full content:
# https://raw.githubusercontent.com/Gen-Verse/OpenClaw-RL/main/toolcall-rl/generate_with_retool.py

# Key substitutions to apply when copying:
# 1. Module docstring: "ONYX Tool-Call RL generation (retool). Ported from Gen-Verse/OpenClaw-RL."
# 2. In format_conversation_with_tools system_prompt:
#    system_content = (
#        "You are ONYX, a helpful assistant that can use Python "
#        "tools to solve mathematical problems. When you need "
#        "to perform calculations, use the code_interpreter "
#        "tool to execute code and get results."
#    )