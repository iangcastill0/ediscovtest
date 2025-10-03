import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { SpeedDial, SpeedDialAction } from '@mui/material';

// assets
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HtmlIcon from '@mui/icons-material/Html';
import ArticleIcon from '@mui/icons-material/Article';
import JavascriptIcon from '@mui/icons-material/Javascript';

// =============================|| UI SPEEDDIAL - SIMPLE ||============================= //

export default function ExportButton({exportToHtml, exportToPdf, exportToCSV, exportToJson}) {
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);

    // fab action options
    const actions = [
        { icon: <HtmlIcon sx={{ color: theme.palette.grey[700] }} />, name: 'Export to HTML' },
        { icon: <PictureAsPdfIcon sx={{ color: theme.palette.grey[700] }} />, name: 'Export to PDF' },
        { icon: <ArticleIcon sx={{ color: theme.palette.grey[700] }} />, name: 'Export to CSV' },
        { icon: <JavascriptIcon sx={{ color: theme.palette.grey[700] }} />, name: 'Export to JSON' }
    ];

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpen = () => {
        setOpen(true);
    };

    const handleAction = (index) => {
        switch (index) {
            case 0:
                exportToHtml();
                break;
            case 1:
                exportToPdf();
                break;
            case 2:
                exportToCSV();
                break;
            case 3:
                exportToPdf();
                break;
        
            default:
                break;
        }
    }

    const [hidden, setHidden] = React.useState(false);
    return (
        <SpeedDial
            sx={{
                position: 'absolute',
                '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
                    bottom: theme.spacing(2),
                    right: theme.spacing(2)
                },
                '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
                    top: theme.spacing(2),
                    left: theme.spacing(2)
                }
            }}
            ariaLabel="Export"
            hidden={hidden}
            icon={<FileDownloadIcon />}
            onClose={handleClose}
            onOpen={handleOpen}
            open={open}
            direction="up"
        >
            {actions.map((action, index) => (
                <SpeedDialAction key={action.name} icon={action.icon} tooltipTitle={action.name} onClick={() => handleAction(index)} />
            ))}
        </SpeedDial>
    );
}
