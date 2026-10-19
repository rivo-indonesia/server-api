
import { Innertube } from "youtubei.js";

let musicClientPromise;

function getMusicClient() {
  if (!musicClientPromise) {
    musicClientPromise = Innertube.create({
      lang: "id",
      location: "ID"
    }).catch((error) => {
      musicClientPromise = null;
      throw error;
    });
  }

  return musicClientPromise;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Gunakan GET"
    });
  }

  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Masukkan kata pencarian",
      example: "/api/server?q=alan+walker"
    });
  }

  try {
    const yt = await getMusicClient();
    const search = await yt.music.search(q);
    const shelf = search.songs;

    const results = (shelf?.contents || [])
      .slice(0, 20)
      .map((song) => {
        const thumbnails = song.thumbnails || [];
        const artists = song.artists || [];

        const cover = [...thumbnails].sort(
          (a, b) => (b.width || 0) - (a.width || 0)
        )[0];

        return {
          title: song.title || null,
          artist: artists
            .map((artist) => artist.name)
            .filter(Boolean)
            .join(", "),
          album: song.album?.name || null,
          duration: song.duration?.text || null,
          videoId: song.id || null,
          cover: cover?.url || null,
          source: "YouTube Music",
          url: song.id
            ? `https://music.youtube.com/watch?v=${song.id}`
            : null
        };
      });

    return res.status(200).json({
      success: true,
      query: q,
      count: results.length,
      results
    });
  } catch (error) {
    console.error("YouTube Music error:", error.message);

    return res.status(502).json({
      success: false,
      error: "Gagal mengambil hasil YouTube Music",
      details: error.message
    });
  }
}
