import { StyleSheet, Platform } from 'react-native'

// QuickRun Component Styles
export const quickRunStyles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 48,
    maxWidth: 500,
    width: '100%',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#5809C0',
    textAlign: 'center',
    marginBottom: 40,
  },
  filters: {
    marginBottom: 32,
  },
  filterGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5809C0',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#5809C0',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 12,
    color: '#5809C0',
    marginLeft: 8,
  },
  startButton: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    backgroundColor: '#5809C0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '80%',
    maxWidth: 400,
    maxHeight: '60%',
    padding: 20,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalOptionSelected: {
    backgroundColor: '#D3C2F7',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#5809C0',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
  },
})

// Playlist Component Styles
export const playlistStyles = StyleSheet.create({
  playlistPage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && { minHeight: '100vh' }),
  },
  scrollView: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5809C0',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  playlistHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  playlistInfoSection: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  albumArtGrid: {
    width: 120,
    height: 120,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  albumArt: {
    width: '48%',
    height: '48%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArtText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'Oswald, sans-serif' : undefined,
  },
  albumArtTextDark: {
    color: '#000000',
  },
  playlistDetails: {
    flex: 1,
    gap: 8,
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 28.8,
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  playlistArtists: {
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  playlistSummary: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  quickStartText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  playControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5809C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chooseRouteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#5809C0',
    borderRadius: 20,
  },
  chooseRouteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  playlistTracks: {
    padding: 20,
  },
  trackTableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerCol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5809C0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  titleCol: {
    flex: 2,
  },
  bpmCol: {
    flex: 0.8,
  },
  timeCol: {
    flex: 0.8,
  },
  paceCol: {
    flex: 1,
  },
  trackRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    alignItems: 'center',
  },
  trackTitleCol: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Oswald, sans-serif' : undefined,
  },
  trackInfo: {
    flex: 1,
    gap: 4,
  },
  trackName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Oswald, sans-serif' : undefined,
  },
  trackArtist: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  trackBpmCol: {
    flex: 0.8,
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  trackTimeCol: {
    flex: 0.8,
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  trackPaceCol: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 14,
    color: '#EFEFEF',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  navLabelActive: {
    color: '#5809C0',
  },
})

