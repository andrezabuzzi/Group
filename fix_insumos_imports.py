import re

with open('src/views/Insumos.tsx', 'r') as f:
    content = f.read()

# Remove the duplicated imports block
# The exact string added was:
# import { LayoutGrid, List, TrendingUp, TrendingDown, Clock, Activity, Building, ArrowRight, Download, Receipt, Paperclip, Eye, CheckCircle2, Copy } from 'lucide-react';

content = re.sub(r"import \{ LayoutGrid, List, TrendingUp, TrendingDown, Clock, Activity, Building, ArrowRight, Download, Receipt, Paperclip, Eye, CheckCircle2, Copy \} from 'lucide-react';\n", "", content)

# Now we need to import PieChartIcon from lucide-react, so let's find the large import and add it.
content = content.replace(
    "Upload } from 'lucide-react';",
    "Upload, PieChart as PieChartIcon } from 'lucide-react';"
)

# And fix the PieChart usage where it's used as an icon
content = content.replace(
    '<PieChart size={20} className="text-primary"/>',
    '<PieChartIcon size={20} className="text-primary"/>'
)

with open('src/views/Insumos.tsx', 'w') as f:
    f.write(content)
