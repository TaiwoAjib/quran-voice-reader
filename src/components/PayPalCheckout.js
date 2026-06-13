import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { PAYPAL_CLIENT_ID, PAYPAL_CURRENCY, toPayPalAmount } from '../config/paypal';

// Builds a self-contained HTML page that renders PayPal Smart Buttons and
// captures the payment client-side (no secret key required). Results are sent
// back to React Native via window.ReactNativeWebView.postMessage.
const buildHtml = (amount, label) => {
  const value = toPayPalAmount(amount);
  const sdk = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=${PAYPAL_CURRENCY}&intent=capture&disable-funding=credit`;
  const desc = `Qur'an Voice Reader — ${String(label).replace(/'/g, '')} donation`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html,body { margin:0; padding:0; background:#0c1f17; }
    .wrap { padding:20px 16px; font-family:-apple-system,Roboto,sans-serif; color:#EFF5EC; }
    .amt { text-align:center; font-size:26px; font-weight:800; color:#C9A227; margin:6px 0 2px; }
    .lbl { text-align:center; font-size:13px; color:#8FAF9D; margin-bottom:18px; }
    #paypal-button-container { max-width:420px; margin:0 auto; }
    #status { text-align:center; margin-top:16px; font-size:14px; }
    #loading { text-align:center; color:#8FAF9D; margin-top:24px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="amt">$${value}</div>
    <div class="lbl">${desc}</div>
    <div id="loading">Loading secure PayPal checkout…</div>
    <div id="paypal-button-container"></div>
    <div id="status"></div>
  </div>
  <script src="${sdk}"></script>
  <script>
    function post(msg){ try { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch(e){} }
    function ready(){
      var loading = document.getElementById('loading');
      if (!window.paypal) { if(loading) loading.innerText = 'Could not load PayPal. Check your connection.'; post({type:'error', message:'sdk_failed'}); return; }
      if (loading) loading.style.display = 'none';
      paypal.Buttons({
        style: { layout:'vertical', color:'gold', shape:'pill', label:'paypal', height:46 },
        createOrder: function(data, actions){
          return actions.order.create({
            purchase_units: [{ description: ${JSON.stringify(desc)}, amount: { value: '${value}', currency_code: '${PAYPAL_CURRENCY}' } }],
            application_context: { shipping_preference: 'NO_SHIPPING' }
          });
        },
        onApprove: function(data, actions){
          document.getElementById('status').innerText = 'Processing…';
          return actions.order.capture().then(function(details){
            var name = (details && details.payer && details.payer.name && details.payer.name.given_name) || '';
            post({ type:'success', orderId: details.id, payer: name });
          });
        },
        onCancel: function(){ post({ type:'cancel' }); },
        onError: function(err){ post({ type:'error', message: String(err) }); }
      }).render('#paypal-button-container').catch(function(err){ post({type:'error', message:String(err)}); });
    }
    if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
  </script>
</body>
</html>`;
};

export default function PayPalCheckout({ visible, amount, label, onSuccess, onCancel, onClose }) {
  const html = useMemo(() => buildHtml(amount, label), [amount, label]);

  const handleMessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (msg.type === 'success') onSuccess?.(msg);
    else if (msg.type === 'cancel') onCancel?.('cancel');
    else if (msg.type === 'error') onCancel?.(msg.message || 'error');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete your donation</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#8FAF9D" />
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://www.paypal.com' }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          javaScriptCanOpenWindowsAutomatically
          setSupportMultipleWindows={false}
          mixedContentMode="always"
          startInLoadingState
          userAgent={
            Platform.OS === 'android'
              ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
              : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
          }
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#C9A227" />
            </View>
          )}
          style={{ backgroundColor: '#0c1f17' }}
        />
        <Text style={styles.secureNote}>
          <Ionicons name="lock-closed" size={11} color="#8FAF9D" /> Secured by PayPal
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1f17' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    borderBottomWidth: 1, borderBottomColor: '#1E3A2E',
  },
  title: { color: '#EFF5EC', fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c1f17' },
  secureNote: { textAlign: 'center', color: '#8FAF9D', fontSize: 11, paddingVertical: 10 },
});
