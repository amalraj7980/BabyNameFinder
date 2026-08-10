import Share from 'react-native-share';

export async function shareBabyName(name) {
  if (!name) {
    return;
  }
  const encodedName = encodeURIComponent(name);
  const shareLink = `https://forking.riafy.in/babyname/babyName/details/${encodedName}`;
  try {
    await Share.open({
      title: 'Share via',
      message: `Hey! I've shortlisted the baby name "${name}". Discover more about it by clicking the link.`,
      url: shareLink,
    });
  } catch (error) {
    // user cancelled share — ignore
  }
}
