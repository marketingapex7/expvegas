import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/shows", destination: "/las-vegas-shows", permanent: true },
      { source: "/comedy", destination: "/las-vegas-comedy", permanent: true },
      { source: "/concerts", destination: "/las-vegas-concerts", permanent: true },
      { source: "/sports", destination: "/las-vegas-sports", permanent: true },
      { source: "/attractions", destination: "/las-vegas-attractions", permanent: true },
      { source: "/best/first-timers", destination: "/las-vegas-first-time-visitors", permanent: true },
      { source: "/best/couples", destination: "/las-vegas-for-couples", permanent: true },
      { source: "/best/families", destination: "/las-vegas-for-families", permanent: true },
      { source: "/best/under-100", destination: "/las-vegas-shows-under-100", permanent: true },
      { source: "/best/las-vegas-first-time-visitors", destination: "/las-vegas-first-time-visitors", permanent: true },
      { source: "/best/las-vegas-for-couples", destination: "/las-vegas-for-couples", permanent: true },
      { source: "/best/las-vegas-for-families", destination: "/las-vegas-for-families", permanent: true },
      { source: "/best/las-vegas-shows-under-100", destination: "/las-vegas-shows-under-100", permanent: true },
    ];
  },
};

export default nextConfig;
