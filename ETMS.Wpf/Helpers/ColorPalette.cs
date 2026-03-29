namespace ETMS.Helpers
{
    /// <summary>
    /// Bảng màu thống nhất cho toàn bộ ETMS — Dark Esports Theme.
    /// </summary>
    public static class ColorPalette
    {
        // ── Backgrounds ────────────────────────────────────────────────
        public static readonly Color BgApp     = Color.FromArgb(18,  18,  18);   // #121212
        public static readonly Color BgSidebar = Color.FromArgb(17,  17,  17);   // #111111
        public static readonly Color BgPanel   = Color.FromArgb(24,  24,  24);   // #181818
        public static readonly Color BgCard    = Color.FromArgb(22,  22,  22);   // #161616
        public static readonly Color BgInput   = Color.FromArgb(17,  17,  17);   // #111111
        public static readonly Color BgHover   = Color.FromArgb(30,  30,  30);   // #1E1E1E
        public static readonly Color BgActive  = Color.FromArgb(30,  42,  58);   // #1E2A3A
        public static readonly Color BgDark    = Color.FromArgb(13,  13,  13);   // #0D0D0D

        // ── Borders ────────────────────────────────────────────────────
        public static readonly Color Border        = Color.FromArgb(34,  34,  34);   // #222
        public static readonly Color BorderLight   = Color.FromArgb(38,  38,  38);   // #262626
        public static readonly Color BorderMedium  = Color.FromArgb(42,  42,  42);   // #2A2A2A

        // ── Text ───────────────────────────────────────────────────────
        public static readonly Color TextPrimary   = Color.FromArgb(255, 255, 255);
        public static readonly Color TextSecondary = Color.FromArgb(170, 170, 170);  // #AAA
        public static readonly Color TextMuted     = Color.FromArgb(102, 102, 102);  // #666
        public static readonly Color TextDim       = Color.FromArgb(68,  68,  68);   // #444
        public static readonly Color TextLabel     = Color.FromArgb(136, 136, 136);  // #888

        // ── Accent Colors ──────────────────────────────────────────────
        public static readonly Color Accent        = Color.FromArgb(59,  130, 246);  // #3B82F6 Blue
        public static readonly Color AccentHover   = Color.FromArgb(37,  99,  235);  // #2563EB
        public static readonly Color Success       = Color.FromArgb(16,  185, 129);  // #10B981 Green
        public static readonly Color Warning       = Color.FromArgb(245, 158, 11);   // #F59E0B Amber
        public static readonly Color Danger        = Color.FromArgb(239, 68,  68);   // #EF4444 Red

        // ── Accent Transparent ─────────────────────────────────────────
        public static readonly Color AccentTransp  = Color.FromArgb(20,  59,  130, 246);
        public static readonly Color SuccessTransp = Color.FromArgb(20,  16,  185, 129);
        public static readonly Color WarningTransp = Color.FromArgb(20,  245, 158, 11);
        public static readonly Color DangerTransp  = Color.FromArgb(20,  239, 68,  68);

        // ── Fonts ─────────────────────────────────────────────────────
        public static readonly Font FontTitle   = new Font("Segoe UI", 15f, FontStyle.Regular);
        public static readonly Font FontBig     = new Font("Segoe UI", 13f, FontStyle.Regular);
        public static readonly Font FontNormal  = new Font("Segoe UI",  9f, FontStyle.Regular);
        public static readonly Font FontSmall   = new Font("Segoe UI",  8f, FontStyle.Regular);
        public static readonly Font FontTiny    = new Font("Segoe UI",  7.5f, FontStyle.Regular);
        public static readonly Font FontBold    = new Font("Segoe UI",  9f, FontStyle.Bold);
        public static readonly Font FontNumber  = new Font("Segoe UI", 28f, FontStyle.Bold);
        public static readonly Font FontLabel   = new Font("Segoe UI",  7.5f, FontStyle.Bold);
        public static readonly Font FontCaption = new Font("Segoe UI",  7f, FontStyle.Regular);
    }
}
