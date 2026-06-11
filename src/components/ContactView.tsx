import React from 'react';
import { Mail, ExternalLink, MessageSquare, Instagram } from 'lucide-react';

export default function ContactView() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Contact Us</h1>
        <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">
          Get in touch, share feedback, or stay connected
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="https://www.instagram.com/samskara_cet?igsh=OWZ4OWhvcTdweWtv"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-zinc-950 border border-zinc-800 p-6 hover:border-zinc-600 transition-all group block"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
              <Instagram size={18} className="text-zinc-300" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white uppercase tracking-widest">Connect With Us</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">@samskara_cet</p>
            </div>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">
            Follow us on Instagram for the latest updates, match day stories, and campus football highlights.
          </p>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors flex items-center gap-1">
            Open Instagram <ExternalLink size={12} />
          </span>
        </a>

        <a
          href="mailto:abhijithukr@gmail.com"
          className="bg-zinc-950 border border-zinc-800 p-6 hover:border-zinc-600 transition-all group block"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
              <Mail size={18} className="text-zinc-300" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white uppercase tracking-widest">Queries</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">abhijithukr@gmail.com</p>
            </div>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">
            Have a question or need help? Send us an email and we'll get back to you as soon as possible.
          </p>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors flex items-center gap-1">
            Send Email <ExternalLink size={12} />
          </span>
        </a>

        <a
          href="https://forms.gle/NpFqWqJJ4xFp2PhQ9"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-zinc-950 border border-zinc-800 p-6 hover:border-zinc-600 transition-all group block"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
              <MessageSquare size={18} className="text-zinc-300" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white uppercase tracking-widest">Reviews</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Share Feedback</p>
            </div>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">
            Help us improve! Share your thoughts and suggestions about the prediction experience.
          </p>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors flex items-center gap-1">
            Open Form <ExternalLink size={12} />
          </span>
        </a>
      </div>
    </div>
  );
}
