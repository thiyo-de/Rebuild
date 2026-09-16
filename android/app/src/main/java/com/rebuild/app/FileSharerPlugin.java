package com.rebuild.app;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;

@CapacitorPlugin(name = "FileSharer")
public class FileSharerPlugin extends Plugin {

    @PluginMethod
    public void shareJsonFile(PluginCall call) {
        String filename = call.getString("filename", "rebuild_backup.json");
        String content = call.getString("content", "{}");

        try {
            File cacheDir = getContext().getCacheDir();
            File file = new File(cacheDir, filename);
            FileOutputStream fos = new FileOutputStream(file);
            fos.write(content.getBytes("UTF-8"));
            fos.flush();
            fos.close();

            Uri contentUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                file
            );

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/json");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, "REBUILD Backup: " + filename);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(shareIntent, "Save or Share Backup File");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(chooser);

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to share JSON file: " + e.getMessage(), e);
        }
    }
}
