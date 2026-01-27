// src/story.js

export const STORY = {
    level1_intro: [
        "Mike was a boy who went to sleep… and fell into a dream deeper than any he’d ever known.",

        "In the dream world, his body changed into sharp edges and perfect corners until he became a cube.",

        "Before he could panic, an old cube rolled out of the shadows.\n\n“Welcome,” it said. “You’re trapped here… unless you reach the Heart of the Dungeon.”",

        "“The dungeon shifts,” the old cube warned. “Rooms can rotate but gravity won’t.\nCollect every coin you can, and find the door forward.”",

        [
            "CONTROLS",
            "• Move: A / D  (or ← / →)",
            "• Jump: W  (or ↑)",
            "• Interact / Open Door: Hold E",
            "• Rooms Page (used to rotate rooms): Q",
            "• In Rooms Page: E = rotate left, R = rotate right",
            "• Back / Exit: Esc\n",
        ].join("\n"),

        ["All OBJECTS",
            "• Coin (gold circle): collect ALL to open the exit door.",
            "• Door (blue/cyan block): after all coins are collected, stand near it and HOLD E to finish the level.",
            "• Solid Blocks (dark tiles): walls & floors. (Rotates when you rotate the room)",
            "• Wind Zones (tiles with arrows ^ v < >): pushes you in that direction",
        ].join("\n"),

        ["• Bounce Pad (pink tile): launches you upward when you land on it.",
            "• Moving Platform (long gray platform): moves back and forth.",
            "• Pressure Plate (gray tile): stepping on it dissolves grey blocks near it and allows you to walk through.\n",
            "• Some rooms are puzzles: rotate rooms from the Rooms Page to turn walls into floors or open entrances.",
        ].join("\n")
    ],

    level3_gate: [
        "The air feels heavier as Mike descends.\nThe walls whisper like distant thunder.",
        "Up ahead… lies the Heart of the Dungeon.",
        "“This is it,” the old cube says.\n“Reach the heart… and wake up.”"
    ],

    level3_ending: [
        "The door opens.\nThe dungeon holds its breath.",
        "The Heart of the Dungeon pulses once… then cracks like glass.",
        "Light floods everything.\nThe dream world shatters.\n\nMike wakes up in bed breathing hard finally back in reality.",
        "\n\n CONGRATULATIONS!!! You have beaten the game!"
    ]
};
