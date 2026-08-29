"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, Bot, ExternalLink, MessageCircle, Copy, Check } from "lucide-react";

export default function AdminTelegramPage() {
  const [chatId, setChatId] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollResults, setPollResults] = useState<{ from: string; message: string; chatId: number }[]>([]);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState("tkd_equp_bot");
  const [copied, setCopied] = useState(false);
  const [botConnected, setBotConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check bot status and load saved chat ID
    fetch("/api/telegram/setup")
      .then(r => r.json())
      .then(data => {
        if (data.botInfo?.username) {
          setBotUsername(data.botInfo.username);
          setBotConnected(true);
        } else {
          setBotConnected(false);
        }
      })
      .catch(() => setBotConnected(false));

    const savedId = localStorage.getItem("tg_chat_id");
    if (savedId) setChatId(savedId);
  }, []);

  const handleSave = async () => {
    if (!chatId.trim()) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/users/me/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: chatId.trim() }),
      });
      if (response.ok) {
        localStorage.setItem("tg_chat_id", chatId.trim());
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      localStorage.setItem("tg_chat_id", chatId.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePoll = async () => {
    setIsPolling(true);
    setPollResults([]);
    setPollStatus(null);
    try {
      const response = await fetch("/api/telegram/webhook");
      const data = await response.json();
      if (data.ok) {
        setPollResults(data.processed || []);
        setPollStatus(data.message || "No pending messages");
      } else {
        setPollStatus(`Error: ${data.error || "Failed"}`);
      }
    } catch {
      setPollStatus("Failed to connect. Check your bot token in .env.local");
    } finally {
      setIsPolling(false);
    }
  };

  const copyBotLink = () => {
    navigator.clipboard.writeText(`https://t.me/${botUsername}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Telegram Bot</h1>
            <p className="text-muted-foreground mt-1">
              Manage your Telegram bot for customer interaction and order notifications
            </p>
          </div>

          {/* Bot Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                Bot Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={botConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {botConnected ? "✅ Connected" : "❌ Not Connected"}
                </Badge>
                <span className="text-sm text-muted-foreground">@{botUsername}</span>
                <Button variant="ghost" size="sm" onClick={copyBotLink}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Bot in Telegram
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    BotFather
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Setup Instructions
              </CardTitle>
              <CardDescription>
                Follow these steps to connect your Telegram bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-3">
                <p className="font-semibold text-blue-900">Step 1: Send a command in Telegram</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 ml-2">
                  <li>Open Telegram and search for <strong>@{botUsername}</strong></li>
                  <li>Send <code className="bg-blue-100 px-1 rounded">/start</code> — you&apos;ll see the welcome message with store link</li>
                  <li>Try other commands: <code className="bg-blue-100 px-1 rounded">/shop</code>, <code className="bg-blue-100 px-1 rounded">/about</code>, <code className="bg-blue-100 px-1 rounded">/help</code></li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-amber-900">⚡ Local Development Note</p>
                <p className="text-amber-800 mt-1">
                  Since localhost doesn&apos;t have HTTPS (required for automatic webhooks), use the <strong>&quot;Poll for Messages&quot;</strong> button below to process Telegram messages. In production with HTTPS, the bot responds automatically.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handlePoll} disabled={isPolling} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)]">
                  {isPolling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isPolling ? "Polling..." : "Poll for Messages"}
                </Button>
              </div>

              {pollStatus && (
                <div className={`rounded-lg p-3 text-sm ${pollStatus.includes('Error') || pollStatus.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {pollStatus}
                </div>
              )}

              {pollResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Processed messages:</p>
                  {pollResults.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 text-sm border border-gray-100">
                      <span className="font-semibold text-gray-700">{r.from}:</span>
                      <span className="text-gray-600">{r.message}</span>
                      <span className="text-xs text-gray-400 ml-auto">chat: {r.chatId}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat ID Setup */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                Seller Chat ID
              </CardTitle>
              <CardDescription>
                Enter your Telegram Chat ID to receive order notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-2">
                <p className="font-semibold">How to get your Chat ID:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open <strong>@{botUsername}</strong> in Telegram</li>
                  <li>Send <code className="bg-gray-100 px-1 rounded">/start</code></li>
                  <li>Click <strong>&quot;Poll for Messages&quot;</strong> above</li>
                  <li>Copy the <strong>chat number</strong> from the results</li>
                  <li>Paste it below and click Save</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Input
                  id="chatId"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="e.g., 123456789"
                  className="flex-1"
                />
                <Button onClick={handleSave} disabled={isSaving || !chatId.trim()}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : saved ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : null}
                  {saved ? "Saved!" : "Save"}
                </Button>
              </div>
              {chatId && (
                <p className="text-xs text-muted-foreground">
                  Chat ID: <code className="bg-gray-100 px-1 rounded">{chatId}</code>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
