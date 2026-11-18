// GeoGym live 1v1. Each game code is one Durable Object ("Room") that holds the two players' WebSockets.
// The server never sees the questions: both browsers build the same question list from the seed it hands out.
// It only relays who joined, progress, final scores and rematches.
//
//   wss://mp.geogym.party/room/K7M2Q?name=Alex&host=1&topic=flags&len=10&v=<site version>
//
// Messages from a player:  {t:"start"} (host only), {t:"progress", i, right}, {t:"done", right, ms}, {t:"rematch"}
// Messages to players:     {t:"state", ...}, {t:"start", seed, prev, game, inMs} (prev = this room's earlier seeds, so no question repeats), {t:"opp", i, right}, {t:"oppdone", right, ms},
//                          {t:"over", results}, {t:"rematch", name}, {t:"left", name}, {t:"error", code}
import { DurableObject } from "cloudflare:workers";

const CODE = /^[A-HJ-NP-Z2-9]{5}$/;
const ALLOWED = [/^https:\/\/geogym\.party$/, /^https:\/\/([a-z0-9-]+\.)?geography-gym\.pages\.dev$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const EMPTY_ROOM_TTL = 60 * 60 * 1000; // forget a room an hour after everyone leaves

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9]+)$/);
    if (!m) return new Response("GeoGym multiplayer", { headers: { "content-type": "text/plain" } });
    const origin = request.headers.get("Origin") || "";
    if (!ALLOWED.some(re => re.test(origin))) return new Response("Forbidden", { status: 403 });
    if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
    const code = m[1].toUpperCase();
    if (!CODE.test(code)) return new Response("Bad code", { status: 400 });
    return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
  }
};

const clean = s => String(s || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 20);

export class Room extends DurableObject {
  // Room state lives in storage, because the object can be put to sleep (hibernate) between messages.
  async load() { return (await this.ctx.storage.get("room")) || null; }
  async save(room) { await this.ctx.storage.put("room", room); }
  sockets() { return this.ctx.getWebSockets(); }
  who(ws) { return ws.deserializeAttachment() || {}; }
  send(ws, msg) { try { ws.send(JSON.stringify(msg)); } catch (e) {} }
  broadcast(msg, except) { for (const ws of this.sockets()) if (ws !== except) this.send(ws, msg); }
  players() { return this.sockets().map(ws => this.who(ws)).filter(p => p.id); }
  stateFor(room, me) {
    return { t: "state", you: me.id, host: room.hostId, status: room.status, game: room.game, cfg: room.cfg,
      players: this.players().map(p => ({ id: p.id, name: p.name, host: p.id === room.hostId })) };
  }
  refuse(code) {
    const pair = new WebSocketPair();
    pair[1].accept();
    pair[1].send(JSON.stringify({ t: "error", code }));
    pair[1].close(4000, code);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async fetch(request) {
    const url = new URL(request.url), q = url.searchParams;
    const isHost = q.get("host") === "1";
    let room = await this.load();
    const live = this.players();
    if (isHost) {
      // A new game: the code must be free (no one in it right now)
      if (live.length) return this.refuse("taken");
      const len = [10, 20].includes(+q.get("len")) ? +q.get("len") : 10;
      room = { cfg: { topic: clean(q.get("topic")).slice(0, 40) || "flags", len, v: clean(q.get("v")) }, hostId: null, status: "lobby", game: 0, seed: 0, seeds: [], results: {}, rematch: [] };
    } else {
      if (!room || !live.some(p => p.id === room.hostId)) return this.refuse("nogame");
      if (live.length >= 2) return this.refuse("full");
      if (room.status === "playing") return this.refuse("started");
      if (room.cfg.v && q.get("v") && room.cfg.v !== clean(q.get("v"))) return this.refuse("version");
    }
    const me = { id: crypto.randomUUID().slice(0, 8), name: clean(q.get("name")) || (isHost ? "Player 1" : "Player 2") };
    if (isHost) room.hostId = me.id;
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment(me);
    await this.save(room);
    await this.ctx.storage.deleteAlarm();
    for (const ws of this.sockets()) this.send(ws, this.stateFor(room, this.who(ws)));
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(ws, raw) {
    let msg; try { msg = JSON.parse(raw); } catch (e) { return; }
    const me = this.who(ws), room = await this.load();
    if (!room || !me.id) return;
    if (msg.t === "start" || msg.t === "rematch") {
      if (msg.t === "start" && me.id !== room.hostId) return;
      if (this.players().length < 2 || room.status === "playing") return;
      if (msg.t === "rematch") {
        if (!room.rematch.includes(me.id)) room.rematch.push(me.id);
        this.broadcast({ t: "rematch", id: me.id, name: me.name }, ws);
        if (room.rematch.length < 2) return this.save(room);
      }
      const prev = (room.seeds || []).slice(-40);
      room.status = "playing"; room.game++; room.seed = crypto.getRandomValues(new Uint32Array(1))[0];
      room.seeds = [...prev, room.seed]; room.results = {}; room.rematch = [];
      await this.save(room);
      return this.broadcast({ t: "start", seed: room.seed, prev, game: room.game, cfg: room.cfg, inMs: 3000 });
    }
    if (room.status !== "playing") return;
    if (msg.t === "progress") {
      const r = room.results[me.id] || (room.results[me.id] = {});
      r.i = Math.max(0, Math.min(room.cfg.len, msg.i | 0)); r.right = Math.max(0, Math.min(r.i, msg.right | 0));
      await this.save(room);
      return this.broadcast({ t: "opp", id: me.id, i: r.i, right: r.right }, ws);
    }
    if (msg.t === "done") {
      const r = room.results[me.id] || (room.results[me.id] = {});
      r.done = true; r.i = room.cfg.len; r.right = Math.max(0, Math.min(room.cfg.len, msg.right | 0)); r.ms = Math.max(0, msg.ms | 0);
      this.broadcast({ t: "oppdone", id: me.id, right: r.right, ms: r.ms }, ws);
      await this.finishIfOver(room);
    }
  }

  // The game is over when everyone still connected has finished
  async finishIfOver(room) {
    const ids = this.players().map(p => p.id);
    if (room.status !== "playing" || !ids.length || !ids.every(id => room.results[id] && room.results[id].done)) return this.save(room);
    room.status = "done";
    await this.save(room);
    this.broadcast({ t: "over", results: room.results });
  }

  async webSocketClose(ws) { await this.gone(ws); }
  async webSocketError(ws) { await this.gone(ws); }
  async gone(ws) {
    const me = this.who(ws), room = await this.load();
    try { ws.close(1000, "bye"); } catch (e) {}
    if (!room || !me.id) return;
    const rest = this.sockets().filter(s => s !== ws && this.who(s).id !== me.id);
    for (const s of rest) this.send(s, { t: "left", id: me.id, name: me.name, host: me.id === room.hostId });
    room.rematch = room.rematch.filter(id => id !== me.id);
    if (room.status === "playing") {
      // Whoever is left finishes on their own; mark the leaver so the result can say so
      (room.results[me.id] || (room.results[me.id] = {})).left = true;
      const ids = rest.map(s => this.who(s).id);
      if (ids.length && ids.every(id => room.results[id] && room.results[id].done)) { room.status = "done"; for (const s of rest) this.send(s, { t: "over", results: room.results }); }
    }
    await this.save(room);
    if (!rest.length) await this.ctx.storage.setAlarm(Date.now() + EMPTY_ROOM_TTL);
  }
  async alarm() { if (!this.sockets().length) await this.ctx.storage.deleteAll(); }
}
