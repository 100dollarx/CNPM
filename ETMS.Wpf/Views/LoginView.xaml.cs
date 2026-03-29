using System.Windows;
using System.Windows.Input;
using ETMS.BUS;
using ETMS.Enums;

namespace ETMS.Views
{
    public partial class LoginView : Window
    {
        public LoginView()
        {
            InitializeComponent();
            TxtUsername.Focus();
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

        private void BtnMinimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;
        private void BtnClose_Click(object sender, RoutedEventArgs e) => Application.Current.Shutdown();

        // ─── Login logic ─────────────────────────────────────────────
        private void TxtPassword_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter) PerformLogin();
        }

        private void BtnLogin_Click(object sender, RoutedEventArgs e) => PerformLogin();

        private void PerformLogin()
        {
            var username = TxtUsername.Text.Trim();
            var password = TxtPassword.Password;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                ShowError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
                return;
            }

            BtnLogin.IsEnabled = false;
            BtnLogin.Content = "ĐANG ĐĂNG NHẬP...";

            try
            {
                var bus    = new AuthBUS();
                var result = bus.Login(username, password, out var user);

                switch (result)
                {
                    case LoginResult.Success:
                        var dashboard = new DashboardView();
                        dashboard.Show();
                        Close();
                        break;
                    case LoginResult.AccountLocked:
                        ShowError("Tài khoản đã bị khóa. Vui lòng liên hệ Admin.");
                        break;
                    default:
                        ShowError("Thông tin đăng nhập không chính xác.");
                        break;
                }
            }
            catch (Exception ex)
            {
                ShowError($"Lỗi kết nối: {ex.Message}");
            }
            finally
            {
                BtnLogin.IsEnabled = true;
                BtnLogin.Content   = "ĐĂNG NHẬP";
            }
        }

        private void ShowError(string message)
        {
            ErrorText.Text       = message;
            ErrorBorder.Visibility = Visibility.Visible;
        }
    }
}
