export async function sendWeeklyReminder(env) {
  const webhookUrl = env.BOSS_REMINDER_WEBHOOK; // Discord webhook URL
  
  const reminderMessage = {
    content: "🔔 **Weekly Boss Reset Reminder!**\n\n" +
      "Weekly bosses have reset! Don't forget to do:\n" +
      "• Normal Zakum\n" +
      "• Normal Hilla\n" +
      "• Normal Horntail\n" +
      "• Pink Bean\n\n" +
      "Need a carry? Use `/needcarry [boss name]`!"
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminderMessage)
    });
    
    if (!response.ok) {
      console.error('Failed to send boss reminder');
    }
  } catch (error) {
    console.error('Error sending boss reminder:', error);
  }
}