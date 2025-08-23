import React from "react";

const SectionCard: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (

  <section id={id} className="w-full">
      <details className="group rounded-lg bg-white shadow-sm ring-1 ring-gray-200 open:shadow-md transition-all">
            <summary className="cursor-pointer px-4 py-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">{title}</h2>
                            <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm group-open:rotate-180 transition-transform">⌄</span>
                                  </summary>
                                        <div className="px-4 pb-4 pt-1 text-sm leading-6 text-gray-700">
                                                {children}
                                                      </div>
                                                          </details>
                                                            </section>
                                                            );const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (

                                                              <li className="flex gap-2 py-1"><span>•</span><span>{children}</span></li>
                                                              );export default function StarFaceInstructions() { return ( <div className="min-h-screen bg-gray-50"> <header className="sticky top-0 z-20 bg-white border-b border-gray-200"> <div className="max-w-3xl mx-auto px-4 py-3"> <h1 className="text-xl font-bold">StarFace – Instructions</h1> <p className="text-sm text-gray-500">Quick guides for Chat, Profile, Parental Control, and Social.</p> </div> </header> <main className="max-w-3xl mx-auto px-4 pb-10 space-y-4"> <SectionCard id="chat" title="Chat – Quick Guide"> <ul> <Bullet><b>Text Channels:</b> Tap <code>#general</code> to talk with everyone.</Bullet> <Bullet><b>Reply/React:</b> Long‑press to reply or add an emoji.</Bullet> <Bullet><b>Friend Requests:</b> Add from a profile, accept in Friends tab, block unwanted.</Bullet> <Bullet><b>Join Server:</b> Tap ➕ → Join Server → enter code.</Bullet> <Bullet><b>Voice Chat:</b> Tap 🎤, allow mic, mute/unmute.</Bullet> <Bullet><b>Safety:</b> Be kind, no personal info, use Report/Block if needed.</Bullet> </ul> </SectionCard>

                                                              <SectionCard id="profile" title="Profile – Quick Guide">
                                                                    <ul>
                                                                            <Bullet><b>Picture & Name:</b> Update avatar and display name.</Bullet>
                                                                                    <Bullet><b>Bio & Status:</b> Short bio, set Online 🟢 / Away 🌙 / Busy 🔴.</Bullet>
                                                                                            <Bullet><b>Privacy:</b> Public, Friends Only, or Private.</Bullet>
                                                                                                    <Bullet><b>Good Habits:</b> Keep it positive, no personal info.</Bullet>
                                                                                                          </ul>
                                                                                                              </SectionCard>

                                                                                                                  <SectionCard id="parental" title="Parental Control – Quick Guide">
                                                                                                                        <ul>
                                                                                                                                <Bullet><b>Screen‑Time:</b> Daily limits with warnings.</Bullet>
                                                                                                                                        <Bullet><b>Content Filter:</b> Blocks bad words and unsafe media.</Bullet>
                                                                                                                                                <Bullet><b>Feature Locks:</b> Parents can toggle voice, images, server joins.</Bullet>
                                                                                                                                                        <Bullet><b>Activity:</b> Parents may see basic activity for safety.</Bullet>
                                                                                                                                                              </ul>
                                                                                                                                                                  </SectionCard>

                                                                                                                                                                      <SectionCard id="social" title="StarFace Social – Quick Guide">
                                                                                                                                                                            <ul>
                                                                                                                                                                                    <Bullet><b>Post:</b> Share photos, videos, or text if enabled.</Bullet>
                                                                                                                                                                                            <Bullet><b>Interact:</b> Like ❤️, comment 💬, share ↗️.</Bullet>
                                                                                                                                                                                                    <Bullet><b>Visibility:</b> Everyone, Friends Only, or Private.</Bullet>
                                                                                                                                                                                                            <Bullet><b>Safety:</b> No personal info, report unsafe content.</Bullet>
                                                                                                                                                                                                                  </ul>
                                                                                                                                                                                                                      </SectionCard>
                                                                                                                                                                                                                        </main>
                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                        ); }

                                                                                                                                                                                                                        