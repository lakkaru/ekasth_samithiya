import React, { useState, useEffect } from "react";
import { Box, Button, Card, CardContent, Typography, Alert, CircularProgress, Chip, Divider, TextField, Stack } from "@mui/material";
import { WhatsApp as WhatsAppIcon, CloudSync as CloudIcon, Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import Layout from "../../components/layout";
import { navigate } from "gatsby";
import api from "../../utils/api";
import loadable from "@loadable/component";

const AuthComponent = loadable(() => import("../../components/common/AuthComponent"));

export default function WhatsAppBotAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "info" });

  // Cloud API settings
  const [cloudSettings, setCloudSettings] = useState({ phoneNumberId: '', accessToken: '', verifyToken: '', appSecret: '' });
  const [loadingSettings, setLoadingSettings] = useState(false);

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated);
    setRoles(roles);
    if (!isAuthenticated || !(roles.includes("super-admin") || roles.includes("vice-secretary"))) {
      navigate("/login/user-login");
    }
  };

  const showAlert = (message, severity = "info") => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: "", severity: "info" }), 5000);
  };

  const isSuperAdmin = roles.includes('super-admin');

  const loadSetting = async (name) => {
    try {
      const res = await api.get(`/system-settings/${name}`);
      if (res.data && res.data.setting) return res.data.setting.settingValue;
    } catch (err) {
      return null;
    }
    return null;
  };

  const fetchCloudSettings = async () => {
    if (!isSuperAdmin) return;
    setLoadingSettings(true);
    try {
      const phoneNumberId = await loadSetting('WHATSAPP_CLOUD_PHONE_NUMBER_ID');
      const accessToken = await loadSetting('WHATSAPP_CLOUD_ACCESS_TOKEN');
      const verifyToken = await loadSetting('WHATSAPP_CLOUD_VERIFY_TOKEN');
      const appSecret = await loadSetting('WHATSAPP_CLOUD_APP_SECRET');
      setCloudSettings({ phoneNumberId: phoneNumberId || '', accessToken: accessToken || '', verifyToken: verifyToken || '', appSecret: appSecret || '' });
    } catch (err) {
      console.error('Error loading cloud settings', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) fetchCloudSettings();
  }, [isAuthenticated, roles]);

  const handleCloudSave = async () => {
    if (!isSuperAdmin) return showAlert('නිලධාරීන්ට පමණක් මේ වෙනස්කම් කිරීමට අවසර ඇත', 'error');
    setLoadingSettings(true);
    try {
      const payloads = [
        { settingName: 'WHATSAPP_CLOUD_PHONE_NUMBER_ID', settingValue: cloudSettings.phoneNumberId, settingType: 'general', description: 'WhatsApp Cloud phone number id' },
        { settingName: 'WHATSAPP_CLOUD_ACCESS_TOKEN', settingValue: cloudSettings.accessToken, settingType: 'general', description: 'WhatsApp Cloud access token' },
        { settingName: 'WHATSAPP_CLOUD_VERIFY_TOKEN', settingValue: cloudSettings.verifyToken, settingType: 'general', description: 'WhatsApp Cloud webhook verify token' },
        { settingName: 'WHATSAPP_CLOUD_APP_SECRET', settingValue: cloudSettings.appSecret, settingType: 'general', description: 'WhatsApp Cloud app secret for signature verification' }
      ];

      for (const p of payloads) {
        await api.post('/system-settings/upsert', p);
      }

      showAlert('Cloud API settings saved successfully', 'success');
    } catch (err) {
      console.error('Error saving cloud settings', err);
      showAlert('Failed to save Cloud API settings', 'error');
    } finally {
      setLoadingSettings(false);
    }
  };

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <WhatsAppIcon sx={{ fontSize: 40, color: '#25D366', mr: 2 }} />
          <Typography variant="h4">WhatsApp Management (Organization Account)</Typography>
        </Box>

        {alert.open && (
          <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert({ ...alert, open: false })}>
            {alert.message}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CloudIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Cloud API Configuration</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {!isSuperAdmin ? (
              <Alert severity="warning">Only super-admins can view or change Cloud API settings.</Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Configure your Meta WhatsApp Direct API credentials here. These settings will override the <code>.env</code> file if present.
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Phone Number ID"
                    value={cloudSettings.phoneNumberId}
                    onChange={e => setCloudSettings({ ...cloudSettings, phoneNumberId: e.target.value })}
                    fullWidth
                    helperText="From Meta Developer Portal > WhatsApp > API Setup"
                  />
                  <TextField
                    label="Access Token (Permanent)"
                    value={cloudSettings.accessToken}
                    onChange={e => setCloudSettings({ ...cloudSettings, accessToken: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="System User Token with 'whatsapp_business_messaging' permission"
                  />
                  <TextField
                    label="Verify Token"
                    value={cloudSettings.verifyToken}
                    onChange={e => setCloudSettings({ ...cloudSettings, verifyToken: e.target.value })}
                    fullWidth
                    helperText="The random string you chose for Webhook verification"
                  />
                  <TextField
                    label="App Secret"
                    value={cloudSettings.appSecret}
                    onChange={e => setCloudSettings({ ...cloudSettings, appSecret: e.target.value })}
                    fullWidth
                    type="password"
                    helperText="From App Settings > Basic"
                  />

                  <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleCloudSave}
                      disabled={loadingSettings}
                      startIcon={loadingSettings ? <CircularProgress size={18} /> : <SaveIcon />}
                      sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ea952' } }}
                    >
                      Save Configuration
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={fetchCloudSettings}
                      disabled={loadingSettings}
                      startIcon={<RefreshIcon />}
                    >
                      Reload from Server
                    </Button>
                  </Box>
                </Stack>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Usage Instructions</Typography>
            <Typography variant="body2" component="div">
              <strong>Member Commands:</strong>
              <ul>
                <li><code>BALANCE</code> - View outstanding balance</li>
                <li><code>ABSENT</code> - View meeting absences</li>
                <li><code>FAMILY</code> - View dependents list</li>
                <li><code>HELP</code> - Get help message</li>
              </ul>
              <strong>Notes:</strong>
              <ul>
                <li>Members must have their WhatsApp number registered in the system</li>
                <li>The bot works via the Official Meta Cloud API</li>
              </ul>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
}
