mergeInto(LibraryManager.library, {
    ExportEventToUnity: function (data) {
        if (typeof unityInstance !== 'undefined') {
            unityInstance.SendMessage("WebARExporter", "ReceiveDatafromThreejs", data);
            return 1;
        }
        return 0;
    }
});