using System.Windows;
using System.Windows.Input;

namespace ETMS.Views
{
    public partial class DashboardView : Window
    {
        public DashboardView()
        {
            InitializeComponent();
        }

        // ─── Title bar ───────────────────────────────────────────────
        private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ClickCount == 2)
            {
                WindowState = WindowState == WindowState.Maximized
                    ? WindowState.Normal
                    : WindowState.Maximized;
            }
            else
            {
                DragMove();
            }
        }

        private void BtnMinimize_Click(object sender, RoutedEventArgs e) =>
            WindowState = WindowState.Minimized;

        private void BtnMaxRestore_Click(object sender, RoutedEventArgs e)
        {
            if (WindowState == WindowState.Maximized)
            {
                WindowState = WindowState.Normal;
                BtnMaxRestore.Content = "□";
            }
            else
            {
                WindowState = WindowState.Maximized;
                BtnMaxRestore.Content = "❐";
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e) =>
            Application.Current.Shutdown();

        // ─── Navigation ──────────────────────────────────────────────
        private void NavButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Implement page navigation via ContentArea
            // For now, just highlight the active button
            if (sender is System.Windows.Controls.Button btn)
            {
                var tag = btn.Tag?.ToString();
                // Future: load the corresponding UserControl into ContentArea
            }
        }

        // ─── Logout ──────────────────────────────────────────────────
        private void BtnLogout_Click(object sender, RoutedEventArgs e)
        {
            var login = new LoginView();
            login.Show();
            Close();
        }
    }
}
