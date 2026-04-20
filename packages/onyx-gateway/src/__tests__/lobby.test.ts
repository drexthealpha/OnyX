import { describe, test, expect } from "bun:test";
import { Lobby } from "../lobby.js";
import type { Channel } from "../channels/index.js";

describe("Lobby FIFO queue", () => {
  test("enqueues and dispatches messages in FIFO order", async () => {
    const received: string[] = [];

    const fakeChannel: Channel = {
      name: "test",
      init: async () => {},
      send: async (msg) => {
        received.push(msg.content);
      },
      onMessage: () => {},
    };

    const channels = new Map<string, Channel>([["test", fakeChannel]]);
    const lobby = new Lobby(channels);

    lobby.enqueue({ channelName: "test", to: "user1", content: "first", conversationId: "a" });
    lobby.enqueue({ channelName: "test", to: "user1", content: "second", conversationId: "b" });
    lobby.enqueue({ channelName: "test", to: "user1", content: "third", conversationId: "c" });

    await new Promise((r) => setTimeout(r, 50));

    expect(received).toEqual(["first", "second", "third"]);
  });
});